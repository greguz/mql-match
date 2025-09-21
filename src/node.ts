import {
  type Binary,
  BSONType,
  type BSONValue,
  type Double,
  type Int32,
  Long,
  type ObjectId,
  type Timestamp,
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

export interface BooleanNode {
  kind: typeof BSONType.bool
  value: boolean
}

export function nBoolean(value: boolean): BooleanNode {
  return { kind: BSONType.bool, value }
}

export interface NullishNode {
  kind: typeof BSONType.null
  value: null
}

export function nNullish(): NullishNode {
  return { kind: BSONType.null, value: null }
}

export interface DoubleNode {
  kind: typeof BSONType.double
  value: number
}

export function nDouble(value: number): DoubleNode {
  return { kind: BSONType.double, value }
}

export interface LongNode {
  kind: typeof BSONType.long
  value: Long
}

export function nLongNode(value: bigint): LongNode | DoubleNode {
  return value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER
    ? nDouble(Number(value))
    : { kind: BSONType.long, value: Long.fromBigInt(value) }
}

export interface StringNode {
  kind: typeof BSONType.string
  value: string
}

export function nString(value: string): StringNode {
  return { kind: BSONType.string, value }
}

export interface TimestampNode {
  kind: typeof BSONType.timestamp
  value: Timestamp
}

export interface DateNode {
  kind: typeof BSONType.date
  value: Date
}

export interface ArrayNode<T = unknown> {
  kind: typeof BSONType.array
  value: T[]
}

export interface BinaryNode {
  kind: typeof BSONType.binData
  value: Uint8Array
}

export interface ObjectIdNode {
  kind: typeof BSONType.objectId
  value: ObjectId
}

export interface RegExpNode {
  kind: typeof BSONType.regex
  value: RegExp
}

export interface ObjectNode {
  kind: typeof BSONType.object
  value: Record<string, unknown>
}

export function nObject(value: Record<string, unknown>): ObjectNode {
  return { kind: BSONType.object, value }
}

/**
 * A node that can be unwrapped directly (value)
 */
export type ValueNode =
  | ArrayNode
  | BinaryNode
  | BooleanNode
  | DateNode
  | DoubleNode
  | LongNode
  | NullishNode
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
      return nLongNode(value)
    case 'boolean':
      return nBoolean(value)
    case 'function':
      throw new TypeError('Functions are not supported')
    case 'number':
      return nDouble(value)
    case 'string':
      return nString(value)
    case 'symbol':
      throw new TypeError('Symbols are not supported')
  }

  if (isArray(value)) {
    return { kind: BSONType.array, value }
  }
  if (isDate(value)) {
    return { kind: BSONType.date, value }
  }
  if (isBinary(value)) {
    return { kind: BSONType.binData, value }
  }
  if (isRegExp(value)) {
    return { kind: BSONType.regex, value }
  }

  if (isBSON(value)) {
    return parseBSONNode(value)
  }

  if (!isObjectLike(value)) {
    throw new TypeError(`Unsupported expression: ${value}`)
  }

  return { kind: BSONType.object, value }
}

/**
 * Parse supported BSON objects.
 */
function parseBSONNode(obj: BSONValue): ValueNode {
  switch (obj._bsontype.toLowerCase()) {
    case 'binary':
      return {
        kind: BSONType.binData,
        value: (obj as Binary).buffer,
      }
    case 'objectid':
      return {
        kind: BSONType.objectId,
        value: obj as ObjectId,
      }
    case 'timestamp':
      return {
        kind: BSONType.timestamp,
        value: obj as Timestamp,
      }
    case 'int32':
      return {
        kind: BSONType.double,
        value: (obj as Int32).value,
      }
    case 'double':
      return {
        kind: BSONType.double,
        value: (obj as Double).value,
      }
    case 'long':
      return {
        kind: BSONType.long,
        value: obj as Long,
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
