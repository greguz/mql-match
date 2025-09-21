import type { ObjectId, Timestamp } from 'bson'

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

/**
 * All types of nodes.
 */
export type Node = ExpressionNode | OperatorNode | ValueNode
