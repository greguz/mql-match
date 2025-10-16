import { type Decimal128, Int32, Long, type ObjectId, Timestamp } from 'bson'
import type { Decimal } from 'decimal.js'

import type { Path } from './path.js'

export const NodeKind = Object.freeze({
  // Raw BSON nodes (values)
  ARRAY: 'ARRAY',
  BINARY: 'BINARY',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  DECIMAL: 'DECIMAL',
  DOUBLE: 'DOUBLE',
  INT: 'INT',
  LONG: 'LONG',
  NULLISH: 'NULLISH',
  OBJECT: 'OBJECT',
  OBJECT_ID: 'OBJECT_ID',
  REGEX: 'REGEX',
  STRING: 'STRING',
  TIMESTAMP: 'TIMESTAMP',
  // Expression
  EXPRESSION_ARRAY: 'EXPRESSION_ARRAY',
  EXPRESSION_GETTER: 'EXPRESSION_GETTER',
  EXPRESSION_OPERATOR: 'EXPRESSION_OPERATOR',
  EXPRESSION_PROJECT: 'EXPRESSION_PROJECT',
  // Match/Filter query
  MATCH_ARRAY: 'MATCH_ARRAY',
  MATCH_EXPRESSION: 'MATCH_EXPRESSION',
  MATCH_PATH: 'MATCH_PATH',
  MATCH_SEQUENCE: 'MATCH_SEQUENCE',
  // Update query
  UPDATE_PATH: 'UPDATE_PATH',
})

/**
 * BSON node.
 */
export interface ArrayNode {
  kind: typeof NodeKind.ARRAY
  value: BSONNode[]
  raw: unknown[] | undefined
}

/**
 * BSON node: `Uint8Array` instance.
 */
export interface BinaryNode {
  kind: typeof NodeKind.BINARY
  value: Uint8Array
}

/**
 * BSON node.
 */
export interface BooleanNode {
  kind: typeof NodeKind.BOOLEAN
  value: boolean
}

export function nBoolean(value: boolean): BooleanNode {
  return { kind: NodeKind.BOOLEAN, value }
}

/**
 * BSON node: `Date` instance.
 */
export interface DateNode {
  kind: typeof NodeKind.DATE
  value: Date
}

export function nDate(value?: Date): DateNode {
  return {
    kind: NodeKind.DATE,
    value: value || new Date(),
  }
}

/**
 * BSON node: `Decimal128` instance.
 */
export interface DecimalNode {
  kind: typeof NodeKind.DECIMAL
  value: Decimal128
}

/**
 * BSON node: JavaScript numbers.
 */
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

/**
 * BSON node: `Int32` instance (32-bit integer).
 */
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

/**
 * BSON node: `Long` instance (64-bit integer).
 */
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

/**
 * BSON node: represents both `null` and `undefined`.
 */
export interface NullishNode {
  kind: typeof NodeKind.NULLISH
  value: null
}

export function nNullish(): NullishNode {
  return { kind: NodeKind.NULLISH, value: null }
}

/**
 * BSON node: plain object.
 */
export interface ObjectNode {
  kind: typeof NodeKind.OBJECT
  keys: string[]
  value: Record<string, BSONNode | undefined>
  raw: Record<string, unknown> | undefined
}

/**
 * BSON node: `ObjectId` instance.
 */
export interface ObjectIdNode {
  kind: typeof NodeKind.OBJECT_ID
  value: ObjectId
}

/**
 * BSON node: `RegExp` instance.
 */
export interface RegExpNode {
  kind: typeof NodeKind.REGEX
  value: RegExp
}

/**
 * BSON node.
 */
export interface StringNode {
  kind: typeof NodeKind.STRING
  value: string
}

export function nString(value: string): StringNode {
  return { kind: NodeKind.STRING, value }
}

/**
 * BSON node: `Timestamp` instance.
 */
export interface TimestampNode {
  kind: typeof NodeKind.TIMESTAMP
  value: Timestamp
}

export function nTimestamp(): TimestampNode {
  return {
    kind: NodeKind.TIMESTAMP,
    value: Timestamp.fromNumber(Math.floor(Date.now() / 1000)),
  }
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
 * Represents an expression.
 */
export type ExpressionNode =
  | BSONNode
  | ExpressionArrayNode
  | ExpressionGetterNode
  | ExpressionOperatorNode
  | ExpressionProjectNode

/**
 * Part of expression engine.
 * An array containing other expressions.
 */
export interface ExpressionArrayNode {
  kind: typeof NodeKind.EXPRESSION_ARRAY
  nodes: ExpressionNode[]
}

/**
 * Part of expression engine.
 * Path's value expresion string (like `$obj.prop`).
 */
export interface ExpressionGetterNode {
  kind: typeof NodeKind.EXPRESSION_GETTER
  path: Path
}

/**
 * Part of expression engine.
 * Expression operator (see `ExpressionOperator` interface).
 */
export interface ExpressionOperatorNode {
  kind: typeof NodeKind.EXPRESSION_OPERATOR
  args: ExpressionNode[]
  operator: string
}

/**
 * Represents an expression object.
 */
export interface ExpressionProjectNode {
  kind: typeof NodeKind.EXPRESSION_PROJECT
  keys: string[]
  /**
   * Not all keys have values.
   * A key without value must be interpreted as inclusion/exclusion key (see `exclusion` flag).
   */
  values: Record<string, ExpressionNode | undefined>
  exclusion: boolean
}

/**
 * Represents a filter/match query.
 */
export type MatchNode =
  | MatchArrayNode
  | MatchExpressionNode
  | MatchPathNode
  | MatchSequenceNode

/**
 * Part of filter/match query engine.
 * Represents the `$elemMatch` operator.
 */
export interface MatchArrayNode {
  kind: typeof NodeKind.MATCH_ARRAY
  path: Path
  /**
   * Not having the `MatchExpressionNode` because it must be top-level.
   */
  node: MatchNode | MatchSequenceNode
  /**
   * Can be negated inside a `$not`.
   */
  negate: boolean
}

/**
 * Part of filter/match query engine.
 * Represents the `$expr` operator.
 * Must be top level (can be inside a `$and` or `$nor` or `$or`).
 */
export interface MatchExpressionNode {
  kind: typeof NodeKind.MATCH_EXPRESSION
  expression: ExpressionNode
}

/**
 * Part of filter/match query engine.
 */
export interface MatchPathNode {
  kind: typeof NodeKind.MATCH_PATH
  path: Path
  /**
   * `QueryOperator`'s name.
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
 * Part of filter/match query engine.
 * A logical sequence (see `operator` field).
 */
export interface MatchSequenceNode {
  kind: typeof NodeKind.MATCH_SEQUENCE
  /**
   * Logical sequence's kind.
   * - `$and`: all nodes must be `true`
   * - `$or`: any node must be `true`
   * - `$nor`: all nodes must be `false`
   */
  operator: '$and' | '$or' | '$nor'
  nodes: MatchNode[]
}

/**
 * Part of update query engine.
 */
export interface UpdatePathNode {
  kind: typeof NodeKind.UPDATE_PATH
  path: Path
  /**
   * `QueryOperator`'s name.
   */
  operator: string
  /**
   * Operator's arguments.
   */
  args: unknown[]
}
