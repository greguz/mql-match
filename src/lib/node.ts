import {
  type Decimal128,
  Int32,
  Long,
  type ObjectId,
  type Timestamp,
} from 'bson'
import type { Decimal } from 'decimal.js'

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
   * An array containing other nodes.
   */
  EXPRESSION_ARRAY: 'EXPRESSION_ARRAY',
  PROJECT: 'PROJECT',
  PATH: 'PATH',
  MATCH_PATH: 'MATCH_PATH',
  MATCH_ARRAY: 'MATCH_ARRAY',
  MATCH_EXPRESSION: 'MATCH_EXPRESSION',
  UPDATE_PATH: 'UPDATE_PATH',
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

export function nInt(value: number | Int32): IntNode {
  return {
    kind: NodeKind.INT,
    value: typeof value === 'number' ? new Int32(value) : value,
  }
}

export interface DecimalNode {
  kind: typeof NodeKind.DECIMAL
  value: Decimal128
}

export interface DoubleNode {
  kind: typeof NodeKind.DOUBLE
  value: number
}

export function nDouble(value: number | Decimal): DoubleNode {
  return {
    kind: NodeKind.DOUBLE,
    value: typeof value === 'number' ? value : value.toNumber(),
  }
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
  raw: unknown[]
}

export interface ObjectNode {
  kind: typeof NodeKind.OBJECT
  keys: string[]
  value: Record<string, BSONNode | undefined>
  raw: Record<string, unknown>
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

export interface OperatorNode {
  kind: typeof NodeKind.OPERATOR
  args: Node[]
  operator: string
}

export function nOperator(operator: string, args: Node[]): OperatorNode {
  return { kind: NodeKind.OPERATOR, operator, args }
}

export interface ExpressionArrayNode {
  kind: typeof NodeKind.EXPRESSION_ARRAY
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
  /**
   * Operators name.
   */
  operator: string
  args: BSONNode[]
  /**
   * Negates the operator result (always a boolean for match operators).
   *
   * If "false" (NOT negated)
   * returns true if **ANY** element inside an array matches with the spec function.
   * (first true returns true)
   *
   * If "true" (negated)
   * returns true if **ALL** elements inside an array matches with the spec function.
   * (first false returns false)
   */
  negate: boolean
}

/**
 * Represents the `$elemMatch` operator.
 */
export interface MatchArrayNode {
  kind: typeof NodeKind.MATCH_ARRAY
  path: Path
  /**
   * Not having the `MatchExpressionNode` because it must be top-level.
   */
  args: Array<MatchArrayNode | MatchPathNode>
  /**
   * Can be negated inside a `$not`.
   */
  negate: boolean
}

export interface UpdatePathNode {
  kind: typeof NodeKind.UPDATE_PATH
  path: Path
  operator: string
  args: BSONNode[]
}

/**
 * Represents the `$expr` operator.
 * Must be top level (can be inside a `$and` or `$nor` or `$or`).
 */
export interface MatchExpressionNode {
  kind: typeof NodeKind.MATCH_EXPRESSION
  expression: Node
}

/**
 * Used by expression.
 * TODO: hmmmmm....
 */
export type Node =
  | BSONNode
  | ExpressionArrayNode
  | OperatorNode
  | PathNode
  | ProjectNode
