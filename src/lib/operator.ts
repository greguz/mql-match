import type { BSONNode, Node } from './node.js'

export interface Context {
  root: BSONNode
  subject: BSONNode
}

/**
 * A mutation function that takes N BSON arguments and returns one BSON result.
 */
export interface Operator {
  /**
   * Operator spec.
   */
  (...args: BSONNode[]): Node
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
  parse?: (args: BSONNode[]) => Node[]
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
): Node[] {
  const minArgs = operator.minArgs ?? operator.parse?.length ?? operator.length
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
