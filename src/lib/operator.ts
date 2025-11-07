import type { BSONNode } from './node.js'

/**
 * Both match and update query types.
 */
export interface QueryOperator<T extends unknown[] = unknown[]> {
  /**
   * Accepts the current document's value and the operator's argument.
   * Returns the the document's value.
   */
  (value: BSONNode, ...args: T): BSONNode
  /**
   * Custom query arguments parsing function.
   * By default take the query as-is.
   */
  parse?: (...args: BSONNode[]) => T
  /**
   * Update operators.
   * When `true` replaces the field's value with its parent and key nodes.
   */
  useParent?: boolean
}

export function withQueryParsing<T extends unknown[]>(
  operator: QueryOperator<T>,
  parse: (...args: BSONNode[]) => T,
): void {
  if (operator.parse !== undefined) {
    throw new Error(
      `Query operator ${operator.name} cannot have multiple parsers`,
    )
  }
  operator.parse = parse
}

/**
 * This will inject a second heading arguments during query resolution.
 * This means that the parsing function must ignore the first 2 arguments.
 */
export function useParent<T extends unknown[]>(
  operator: QueryOperator<[BSONNode, ...T]>,
  parse?: (...args: BSONNode[]) => T,
): void {
  if (operator.useParent !== undefined) {
    throw new Error('Double useParent assignment')
  }
  operator.useParent = true
  if (parse) {
    withQueryParsing(operator, parse as any) // TODO: hacky
  }
}

export function parseQueryArgs<T extends unknown[]>(
  operator: QueryOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}

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

export function withStageParsing<T extends unknown[]>(
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

export function parsePipelineArgs<T extends unknown[]>(
  operator: PipelineOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}
