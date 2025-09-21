import type {
  Binary,
  BSONValue,
  Double,
  Int32,
  ObjectId,
  Timestamp,
} from 'bson'

import { isBSON } from './bson.js'
import { type Path, parsePath } from './path.js'
import {
  isArray,
  isBinary,
  isDate,
  isNullish,
  isObjectLike,
  isRegExp,
} from './util.js'

export interface BigIntNode {
  kind: 'BIG_INT'
  value: bigint
}

export interface BooleanNode {
  kind: 'BOOLEAN'
  value: boolean
}

export function nBoolean(value: boolean): BooleanNode {
  return { kind: 'BOOLEAN', value }
}

export interface NullishNode {
  kind: 'NULLISH'
  value: null
}

export function nNullish(): NullishNode {
  return { kind: 'NULLISH', value: null }
}

export interface NumberNode {
  kind: 'NUMBER'
  value: number
}

export function nNumber(value: number): NumberNode {
  return { kind: 'NUMBER', value }
}

export interface StringNode {
  kind: 'STRING'
  value: string
}

export function nString(value: string): StringNode {
  return { kind: 'STRING', value }
}

export interface TimestampNode {
  kind: 'TIMESTAMP'
  value: Timestamp
}

export interface DateNode {
  kind: 'DATE'
  value: Date
}

export interface ArrayNode<T = unknown> {
  kind: 'ARRAY'
  value: T[]
}

export interface BinaryNode {
  kind: 'BINARY'
  value: Uint8Array
}

export interface ObjectIdNode {
  kind: 'OBJECT_ID'
  value: ObjectId
}

export interface RegExpNode {
  kind: 'REG_EXP'
  value: RegExp
}

export interface ObjectNode {
  kind: 'OBJECT'
  value: Record<string, unknown>
}

export function nObject(value: Record<string, unknown>): ObjectNode {
  return { kind: 'OBJECT', value }
}

/**
 * A node that can be unwrapped directly (value)
 */
export type ValueNode =
  | ArrayNode
  | BigIntNode
  | BinaryNode
  | BooleanNode
  | DateNode
  | NullishNode
  | NumberNode
  | ObjectIdNode
  | ObjectNode
  | RegExpNode
  | StringNode
  | TimestampNode

/**
 * Parse literal values.
 */
export function parseValueNode(value?: unknown): ValueNode {
  if (isNullish(value)) {
    return nNullish()
  }

  switch (typeof value) {
    case 'bigint':
      return value >= Number.MIN_SAFE_INTEGER &&
        value <= Number.MAX_SAFE_INTEGER
        ? nNumber(Number(value))
        : { kind: 'BIG_INT', value }
    case 'boolean':
      return nBoolean(value)
    case 'function':
      throw new TypeError('Functions are not supported')
    case 'number':
      return nNumber(value)
    case 'string':
      return nString(value)
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

  if (!isObjectLike(value)) {
    throw new TypeError(`Unsupported expression: ${value}`)
  }

  return { kind: 'OBJECT', value }
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

export interface Operator {
  /**
   * Operator spec.
   */
  (...args: ValueNode[]): ValueNode
  /**
   * Defaults to `this.parse.length || this.length`.
   */
  minArgs?: number
  /**
   * Defaults to `minArgs`.
   */
  maxArgs?: number
  /**
   * Maps from X input arguments to Y input arguments.
   * Changes the `minArgs` default value.
   */
  parse?: (...args: ValueNode[]) => Array<ValueNode | ExpressionNode>
}

export function withArguments(
  fn: Operator,
  minArgs: number,
  maxArgs?: number,
): Operator {
  fn.minArgs = minArgs
  fn.maxArgs = maxArgs
  return fn
}

export function withParsing(
  fn: Operator,
  parse: NonNullable<Operator['parse']>,
): Operator {
  if (fn.parse !== undefined) {
    throw new Error('Double parsing')
  }
  fn.parse = parse
  return fn
}

/**
 * Prevents arguments expansion.
 */
export function withoutExpansion(fn: Operator): Operator {
  if (fn.minArgs === undefined) {
    fn.minArgs = fn.length // keeps the correct default
  }
  return withParsing(fn, (...args) => args)
}

export interface OperatorNode {
  kind: 'OPERATOR'
  args: Node[]
  operator: Operator
}

/**
 * Special node
 */
export interface ExpressionNode {
  kind: 'EXPRESSION'
  expression: unknown
}

export function nExpression(expression: unknown): ExpressionNode {
  return { kind: 'EXPRESSION', expression }
}

export interface ProjectionNode {
  kind: 'PROJECTION'
  nodes: SetterNode[]
}

export function nProjection(nodes: SetterNode[]): ProjectionNode {
  return {
    kind: 'PROJECTION',
    nodes,
  }
}

export interface GetterNode {
  kind: 'GETTER'
  path: Path
}

export function nGetter(path: string): GetterNode {
  return {
    kind: 'GETTER',
    path: parsePath(path),
  }
}

export interface SetterNode {
  kind: 'SETTER'
  path: Path
  node: Node
}

export function nSetter(path: string, node: Node): SetterNode {
  return {
    kind: 'SETTER',
    path: parsePath(path),
    node,
  }
}

export interface DeleterNode {
  kind: 'DELETER'
  path: Path
}

export function nDeleter(path: string): DeleterNode {
  return {
    kind: 'DELETER',
    path: parsePath(path),
  }
}

/**
 * All types of node.
 */
export type Node =
  | DeleterNode
  | ExpressionNode
  | GetterNode
  | OperatorNode
  | ProjectionNode
  | SetterNode
  | ValueNode
