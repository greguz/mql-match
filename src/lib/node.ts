import {
  type Decimal128,
  Int32,
  Long,
  type ObjectId,
  type Timestamp,
} from 'bson'

import type { Path } from './path.js'

export const NodeKind = Object.freeze({
  ARRAY: 'ARRAY',
  BINARY: 'BINARY',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  /**
   * JavaScript numbers.
   */
  DOUBLE: 'DOUBLE',
  /**
   * 32-bit integer.
   */
  INT: 'INT',
  /**
   * 64-bit integer.
   */
  LONG: 'LONG',
  /**
   * Decimal128
   */
  DECIMAL: 'DECIMAL',
  /**
   * Represents both `null` and `undefined`.
   */
  NULLISH: 'NULLISH',
  OBJECT_ID: 'OBJECT_ID',
  OBJECT: 'OBJECT',
  REGEX: 'REGEX',
  STRING: 'STRING',
  TIMESTAMP: 'TIMESTAMP',
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
  MATCH_PATH: 'MATCH_PATH',
})

export interface BooleanNode {
  kind: typeof NodeKind.BOOLEAN
  value: boolean
}

export function nBoolean(value: boolean): BooleanNode {
  return { kind: NodeKind.BOOLEAN, value }
}

export interface NullishNode {
  kind: typeof NodeKind.NULLISH
  value: null
}

export function nNullish(): NullishNode {
  return { kind: NodeKind.NULLISH, value: null }
}

export interface IntNode {
  kind: typeof NodeKind.INT
  value: Int32
}

export function nInt(value: number): IntNode {
  return { kind: NodeKind.INT, value: new Int32(value) }
}

export interface DecimalNode {
  kind: typeof NodeKind.DECIMAL
  value: Decimal128
}

export interface DoubleNode {
  kind: typeof NodeKind.DOUBLE
  value: number
}

export function nDouble(value: number): DoubleNode {
  return { kind: NodeKind.DOUBLE, value }
}

export interface LongNode {
  kind: typeof NodeKind.LONG
  value: Long
}

export function nLong(value: bigint | number | Long): LongNode {
  if (typeof value === 'bigint') {
    return { kind: NodeKind.LONG, value: Long.fromBigInt(value) }
  }
  if (typeof value === 'number') {
    return { kind: NodeKind.LONG, value: Long.fromNumber(value) }
  }
  return { kind: NodeKind.LONG, value }
}

export interface StringNode {
  kind: typeof NodeKind.STRING
  value: string
}

export function nString(value: string): StringNode {
  return { kind: NodeKind.STRING, value }
}

export interface TimestampNode {
  kind: typeof NodeKind.TIMESTAMP
  value: Timestamp
}

export interface DateNode {
  kind: typeof NodeKind.DATE
  value: Date
}

export function nDate(value: Date): DateNode {
  return { kind: NodeKind.DATE, value }
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

export interface ArrayNode {
  kind: typeof NodeKind.ARRAY
  value: BSONNode[]
}

export interface ObjectNode {
  kind: typeof NodeKind.OBJECT
  keys: string[]
  value: Record<string, BSONNode | undefined>
}

/**
 * Represents a raw BSON value you can directly use.
 */
export type BSONNode =
  | ArrayNode
  | BinaryNode
  | BooleanNode
  | DateNode
  | DecimalNode
  | DoubleNode
  | IntNode
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
  expression: Node
}

export function nExpression(
  expression: Node | undefined,
): ExpressionNode | NullishNode {
  return expression ? { kind: NodeKind.EXPRESSION, expression } : nNullish()
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

export interface MatchPathNode {
  kind: typeof NodeKind.MATCH_PATH
  path: Path
  operator: string
  right: OperatorNode
}

/**
 * All types of node.
 */
export type Node =
  | BSONNode
  | ExpressionNode
  | MatchPathNode
  | NodeArrayNode
  | OperatorNode
  | PathNode
  | ProjectNode
