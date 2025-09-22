import type { BSONNode, ExpressionNode, Node } from './node.js'

/**
 * A mutation function that takes N BSON arguments and returns one BSON result.
 */
export interface Operator {
  /**
   * Operator spec.
   */
  (args: BSONNode[]): Node
  /**
   * @default 1
   */
  minArgs?: number
  /**
   * @default minArgs
   */
  maxArgs?: number
  /**
   * Maps from X input arguments to Y input arguments.
   * Changes the `minArgs` default value.
   */
  parse?: (args: BSONNode[]) => Array<BSONNode | ExpressionNode>
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
  return withParsing(fn, args => args)
}

export function parseOperatorArguments(
  operator: Operator,
  args: BSONNode[],
): Array<BSONNode | ExpressionNode> {
  const minArgs = operator.minArgs ?? 1
  const maxArgs = operator.maxArgs ?? minArgs

  if (minArgs === maxArgs && args.length !== minArgs) {
    throw new TypeError(
      `Operator ${operator.name} requires ${minArgs} arguments (got ${args.length})`,
    )
  }
  if (args.length < minArgs) {
    throw new TypeError(
      `Operator ${operator.name} requires at least ${minArgs} arguments (got ${args.length})`,
    )
  }
  if (args.length > maxArgs) {
    throw new TypeError(
      `Operator ${operator.name} requires at most ${maxArgs} arguments (got ${args.length})`,
    )
  }

  return operator.parse ? operator.parse(args) : args
}

export interface Context {
  root: BSONNode
  source: BSONNode
  target: BSONNode
}
