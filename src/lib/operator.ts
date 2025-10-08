import type { BSONNode, Node } from './node.js'

/**
 * A mutation function that takes N BSON arguments and returns one BSON result.
 */
export interface Operator {
  /**
   * Operator spec.
   */
  (...args: BSONNode[]): BSONNode
  /**
   * @default operator.length
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
  parseArguments?: (...args: BSONNode[]) => Node[]
  /**
   * Push root value into Operator's arguments.
   */
  useRoot?: boolean
}

/**
 * Explicit number of arguments declaration.
 */
export function withArguments(
  fn: Operator,
  minArgs: number,
  maxArgs?: number,
): Operator {
  if (fn.minArgs !== undefined || fn.maxArgs !== undefined) {
    throw new Error(`Operator ${fn.name} has already arguments specified`)
  }
  fn.minArgs = minArgs
  fn.maxArgs = maxArgs
  return fn
}

/**
 * Custom arguments parsing.
 */
export function withParsing(
  fn: Operator,
  parseArguments: NonNullable<Operator['parseArguments']>,
): Operator {
  if (fn.parseArguments) {
    throw new Error(
      `Operator ${fn.name} cannot specify a custom arguments parser`,
    )
  }
  if (fn.minArgs === undefined && fn.maxArgs === undefined) {
    fn.minArgs = parseArguments.length
    fn.maxArgs = parseArguments.length
  }
  fn.parseArguments = parseArguments
  return fn
}

export function useRoot(fn: Operator) {
  if (fn.useRoot !== undefined) {
    throw new Error()
  }
  if (fn.minArgs === undefined && fn.maxArgs === undefined) {
    fn.minArgs = fn.length - 1
    fn.maxArgs = fn.length - 1
  }
  fn.useRoot = true
}

export function parseOperatorArguments(
  operator: Operator,
  args: BSONNode[],
): Node[] {
  const minArgs = operator.minArgs ?? operator.length
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

  return operator.parseArguments ? operator.parseArguments(...args) : args
}
