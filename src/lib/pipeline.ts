import type { BSONNode } from './node.js'

export interface PipelineOperator<T extends unknown[] = unknown[]> {
  /**
   * Accepts an iterable and returns a new iterable.
   */
  (docs: Iterable<BSONNode>, ...args: T): Iterable<BSONNode>
  /**
   * Maps from X input arguments to Y input arguments.
   */
  parse?: (arg: BSONNode) => T
}

export function withParsing<T extends unknown[]>(
  operator: PipelineOperator<T>,
  parse: (...args: BSONNode[]) => T,
): void {
  if (operator.parse !== undefined) {
    throw new Error(
      `Pipeline operator ${operator.name} cannot have multiple parsers`,
    )
  }
  operator.parse = parse
}

export function parseOperatorArgs<T extends unknown[]>(
  operator: PipelineOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}
