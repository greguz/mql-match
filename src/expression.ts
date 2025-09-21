import type {
  Binary,
  BSONValue,
  Double,
  Int32,
  ObjectId,
  Timestamp,
} from 'bson'

import { isBSON } from './bson.js'
import {
  $convert,
  $isNumber,
  $toBool,
  $toDouble,
  $toObjectId,
  $toString,
  $type,
} from './expression/type.js'
import { $$CLUSTER_TIME, $$NOW, $$ROOT } from './expression/variables.js'
import {
  type ExpressionNode,
  type Node,
  type Operator,
  type OperatorNode,
  type ValueNode,
  withoutExpansion,
} from './node.js'
import {
  isArray,
  isBinary,
  isDate,
  isNullish,
  isObjectLike,
  isRegExp,
} from './util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/mql/expressions/
 */
const OPERATORS: Record<string, Operator | undefined> = {
  $convert,
  $isNumber,
  $literal: withoutExpansion(arg => arg),
  $toBool,
  $toDouble,
  $toObjectId,
  $toString,
  $type,
}

/**
 * https://www.mongodb.com/docs/v7.0/reference/aggregation-variables/
 */
const VARIABLES: Record<string, OperatorNode | undefined> = {
  $$CLUSTER_TIME,
  $$NOW,
  $$ROOT,
}

/**
 * Compiles an aggregation expression into a map function.
 */
export function compileExpression(value: unknown) {
  const node = parseNode(value)
  return (value?: unknown): ValueNode['value'] =>
    applyOperators(node, parseValueNode(value)).value
}

/**
 * Recursive downgrade from `Node` to `ValueNode` (unwraps `OperatorNode`s)
 */
function applyOperators(node: Node, subject: ValueNode): ValueNode {
  if (node.kind === 'EXPRESSION') {
    throw new Error('Unexpected node kind (expression)')
  }
  if (node.kind !== 'OPERATOR') {
    return node
  }
  const args = node.args.map(a => applyOperators(a, subject))
  return applyOperators(node.operator(...args), subject)
}

/**
 * Parse literal values.
 */
function parseValueNode(value: unknown): ValueNode {
  if (isNullish(value)) {
    return { kind: 'NULLISH', value: null }
  }

  switch (typeof value) {
    case 'bigint':
      return parseBigIntNode(value)
    case 'boolean':
      return { kind: 'BOOLEAN', value }
    case 'function':
      throw new TypeError('Functions are not supported')
    case 'number':
      return { kind: 'NUMBER', value }
    case 'string':
      return { kind: 'STRING', value }
    case 'symbol':
      throw new TypeError('Symbols are not supported')
  }

  if (isArray(value)) {
    return { kind: 'ARRAY', value }
  }
  if (isDate(value)) {
    return { kind: 'DATE', value }
  }
  if (isBinary(value)) {
    return { kind: 'BINARY', value }
  }
  if (isRegExp(value)) {
    return { kind: 'REG_EXP', value }
  }

  if (isBSON(value)) {
    return parseBSONNode(value)
  }

  if (isObjectLike(value)) {
    return { kind: 'OBJECT', value }
  }

  throw new TypeError(`Unsupported expression: ${value}`)
}

/**
 *
 */
function expandNode(node: ExpressionNode | ValueNode): Node {
  switch (node.kind) {
    case 'ARRAY':
      return {
        kind: 'OPERATOR',
        args: node.value.map(parseNode),
        operator: (...args) => ({
          kind: 'ARRAY',
          value: args.map(a => a.value),
        }),
      }
    case 'OBJECT':
      return parseObjectNode(node.value)
    case 'STRING':
      return parseStringNode(node.value)
    default:
      return node
  }
}

/**
 *
 */
function expandExpression(node: Node): Node {
  if (node.kind === 'EXPRESSION') {
    return parseNode(node.expression)
  }
  return node
}

/**
 * Parse both values and operators.
 */
function parseNode(value: unknown): Node {
  return expandNode(parseValueNode(value))
}

/**
 * Parse supported BSON objects.
 */
function parseBSONNode(obj: BSONValue): ValueNode {
  switch (obj._bsontype.toLowerCase()) {
    case 'binary':
      return {
        kind: 'BINARY',
        value: (obj as Binary).buffer,
      }
    case 'objectid':
      return {
        kind: 'OBJECT_ID',
        value: obj as ObjectId,
      }
    case 'timestamp':
      return {
        kind: 'TIMESTAMP',
        value: obj as Timestamp,
      }
    case 'int32':
      return {
        kind: 'NUMBER',
        value: (obj as Int32).value,
      }
    case 'double':
      return {
        kind: 'NUMBER',
        value: (obj as Double).value,
      }
    default:
      throw new TypeError(`Unsupported BSON type: ${obj._bsontype}`)
  }
}

/**
 * Downgrade BigInt to Number when possible.
 */
function parseBigIntNode(value: bigint): ValueNode {
  if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) {
    return { kind: 'NUMBER', value: Number(value) }
  }
  return { kind: 'BIG_INT', value }
}

/**
 * Apply operators and system variables.
 */
function parseStringNode(value: string): Node {
  if (value[0] === '$' && value[1] === '$') {
    const node = VARIABLES[value]
    if (!node) {
      throw new TypeError(`Unsupported system variable: ${value}`)
    }
    return node
  }

  if (value[0] === '$') {
    // TODO: getter
    throw new TypeError(`TODO: getter (${value})`)
  }

  return { kind: 'STRING', value }
}

function parseObjectNode(obj: Record<string, unknown>): Node {
  const keys = Object.keys(obj)

  if (keys.length === 1 && keys[0][0] === '$') {
    const key = keys[0]

    const operator = OPERATORS[key]
    if (!operator) {
      throw new TypeError(`Unsupported expression operator: ${key}`)
    }

    const args = parseOperatorArguments(obj[key])
    const minArgs =
      operator.minArgs || operator.parse?.length || operator.length
    const maxArgs = operator.maxArgs || minArgs

    if (minArgs === maxArgs && args.length !== minArgs) {
      throw new TypeError(
        `${key} operator requires ${minArgs} arguments (got ${args.length})`,
      )
    }
    if (args.length < minArgs) {
      throw new TypeError(
        `${key} operator requires at least ${minArgs} arguments (got ${args.length})`,
      )
    }
    if (args.length > minArgs) {
      throw new TypeError(
        `${key} operator requires at most ${maxArgs} arguments (got ${args.length})`,
      )
    }

    return {
      kind: 'OPERATOR',
      args: operator.parse
        ? operator.parse(...args).map(expandExpression)
        : args.map(expandNode),
      operator,
    }
  }

  // TODO: projection
  throw new TypeError('TODO: projection')
}

/**
 * Prepare operator's arguments array.
 */
function parseOperatorArguments(arg: unknown): ValueNode[] {
  if (isNullish(arg)) {
    return []
  }
  if (isArray(arg)) {
    return arg.map(parseValueNode)
  }
  return [parseValueNode(arg)]
}
