import { BSONType, Long, type ObjectId, type Timestamp } from 'bson'

import type { Path } from './path.js'

export const NodeKind = Object.freeze({
  ARRAY: BSONType.array,
  BINARY: BSONType.binData,
  BOOLEAN: BSONType.bool,
  DATE: BSONType.date,
  /**
   * JavaScript numbers.
   */
  DOUBLE: BSONType.double,
  /**
   * 32-bit integer.
   */
  INT: BSONType.int,
  /**
   * 64-bit integer.
   */
  LONG: BSONType.long,
  /**
   * Represents both `null` and `undefined`.
   */
  NULLISH: BSONType.null,
  OBJECT_ID: BSONType.objectId,
  OBJECT: BSONType.object,
  REGEX: BSONType.regex,
  STRING: BSONType.string,
  TIMESTAMP: BSONType.timestamp,
  /**
   * Operator declaration.
   */
  OPERATOR: 'OPERATOR',
  /**
   * Implementation specific node.
   * Returned by operators.
   */
  EXPRESSION: 'EXPRESSION',
  /**
   * An array containing other nodes.
   */
  NODE_ARRAY: 'NODE_ARRAY',
  PROJECT: 'PROJECT',
  PATH: 'PATH',
})

export interface BooleanNode {
  kind: typeof NodeKind.BOOLEAN
  value: boolean
}

export function nBoolean(value: boolean): BooleanNode {
  return { kind: BSONType.bool, value }
}

export interface NullishNode {
  kind: typeof NodeKind.NULLISH
  value: null
}

export function nNullish(): NullishNode {
  return { kind: BSONType.null, value: null }
}

export interface DoubleNode {
  kind: typeof NodeKind.DOUBLE
  value: number
}

export function nDouble(value: number): DoubleNode {
  return { kind: BSONType.double, value }
}

export interface LongNode {
  kind: typeof NodeKind.LONG
  value: Long
}

export function nLongNode(value: bigint): LongNode | DoubleNode {
  return value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER
    ? nDouble(Number(value))
    : { kind: BSONType.long, value: Long.fromBigInt(value) }
}

export interface StringNode {
  kind: typeof NodeKind.STRING
  value: string
}

export function nString(value: string): StringNode {
  return { kind: BSONType.string, value }
}

export interface TimestampNode {
  kind: typeof NodeKind.TIMESTAMP
  value: Timestamp
}

export interface DateNode {
  kind: typeof NodeKind.DATE
  value: Date
}

export interface ArrayNode<T = unknown> {
  kind: typeof NodeKind.ARRAY
  value: T[]
}

export interface BinaryNode {
  kind: typeof NodeKind.BINARY
  value: Uint8Array
}

export interface ObjectIdNode {
  kind: typeof NodeKind.OBJECT_ID
  value: ObjectId
}

export interface RegExpNode {
  kind: typeof NodeKind.REGEX
  value: RegExp
}

export interface ObjectNode {
  kind: typeof NodeKind.OBJECT
  value: Record<string, unknown>
}

export function nObject(value: Record<string, unknown>): ObjectNode {
  return { kind: BSONType.object, value }
}

/**
 * Represents a raw BSON value you can directly use.
 */
export type BSONNode =
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
 * Implementation specific node.
 * Returned by operators.
 */
export interface ExpressionNode {
  kind: typeof NodeKind.EXPRESSION
  expression: unknown
}

export function nExpression(expression: unknown): ExpressionNode {
  return { kind: NodeKind.EXPRESSION, expression }
}

export interface OperatorNode {
  kind: typeof NodeKind.OPERATOR
  args: Node[]
  operator: string
}

export function nOperator(operator: string, args: Node[]): OperatorNode {
  return { kind: NodeKind.OPERATOR, operator, args }
}

export interface NodeArrayNode {
  kind: typeof NodeKind.NODE_ARRAY
  nodes: Node[]
}

export interface ProjectNode {
  kind: typeof NodeKind.PROJECT
  nodes: PathNode[]
  exclusion: boolean
}

export interface PathNode {
  kind: typeof NodeKind.PATH
  path: Path
  value: Node
}

/**
 * All types of node.
 */
export type Node =
  | BSONNode
  | ExpressionNode
  | NodeArrayNode
  | OperatorNode
  | PathNode
  | ProjectNode
