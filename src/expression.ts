import {
  $abs,
  $add,
  $ceil,
  $divide,
  $exp,
  $floor,
  $ln,
  $log,
  $log10,
  $mod,
  $multiply,
  $pow,
  $round,
  $sqrt,
  $subtract,
  $trunc,
} from './expression/arithmetic.js'
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
  nGetter,
  nNullish,
  nObject,
  nProjection,
  nSetter,
  type Operator,
  type OperatorNode,
  parseValueNode,
  type SetterNode,
  type ValueNode,
  withoutExpansion,
} from './node.js'
import { getPathValue, setPathValue, unsetPathValue } from './path.js'
import { isArray, isNullish } from './util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/mql/expressions/
 */
const OPERATORS: Record<string, Operator | undefined> = {
  $abs,
  $add,
  $ceil,
  $convert,
  $divide,
  $exp,
  $floor,
  $isNumber,
  $literal: withoutExpansion(arg => arg),
  $ln,
  $log,
  $log10,
  $mod,
  $multiply,
  $pow,
  $round,
  $sqrt,
  $subtract,
  $toBool,
  $toDouble,
  $toObjectId,
  $toString,
  $trunc,
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
  return (value?: unknown): ValueNode['value'] => {
    const root = parseValueNode(value)
    const ctx: Context = {
      root,
      source: root,
      target: nNullish(),
    }
    return applyOperators(node, ctx).value
  }
}

interface Context {
  root: ValueNode
  source: ValueNode
  target: ValueNode
}

/**
 * Recursive downgrade from `Node` to `ValueNode` (unwraps `OperatorNode`s)
 */
function applyOperators(node: Node, ctx: Context): ValueNode {
  switch (node.kind) {
    // Shouldn't be here (recursive resoluzione is done during build time)
    case 'EXPRESSION': {
      throw new Error(`Unexpected node kind: ${node.kind}`)
    }

    // Apply operators
    case 'OPERATOR': {
      const args = node.args.map(a => applyOperators(a, ctx))
      return applyOperators(node.operator(...args), ctx)
    }

    // Resolve paths
    case 'GETTER': {
      return parseValueNode(getPathValue(node.path, ctx.source.value))
    }

    //
    case 'SETTER': {
      setPathValue(
        node.path,
        ctx.target.value,
        applyOperators(node.node, ctx).value,
      )
      return ctx.target // TODO: huh?
    }

    //
    case 'DELETER': {
      unsetPathValue(node.path, ctx.target.value)
      return ctx.target // TODO: huh?
    }

    // Resolve expression objects
    case 'PROJECTION': {
      const scope: Context = {
        root: ctx.root,
        source: ctx.source,
        target: nObject({}),
      }
      for (const n of node.nodes) {
        applyOperators(n, scope)
      }
      return scope.target
    }

    // Should be a raw value
    default:
      return node
  }
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
    return nGetter(value.substring(1))
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
    if (args.length > maxArgs) {
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

  const nodes: SetterNode[] = []

  for (const key of keys) {
    const value = obj[key]
    if (value === 0 || value === false) {
      throw new Error('Omit is currently not supported')
    }

    if (value === 1 || value === true) {
      nodes.push(nSetter(key, nGetter(key)))
    } else {
      nodes.push(nSetter(key, parseNode(value)))
    }
  }

  return nProjection(nodes)
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
