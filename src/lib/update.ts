import type { BSONNode } from './node.js'

/**
 * Both match and update query types.
 */
export interface UpdateOperator<T extends unknown[] = unknown[]> {
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

export function withParsing<T extends unknown[]>(
  fn: UpdateOperator<T>,
  parse: (...args: BSONNode[]) => T,
): void {
  if (fn.parse !== undefined) {
    throw new Error(`Query operator ${fn.name} cannot have multiple parsers`)
  }
  fn.parse = parse
}

/**
 * This will inject a second heading arguments during query resolution.
 * This means that the parsing function must ignore the first 2 arguments.
 */
export function useParent<T extends unknown[]>(
  operator: UpdateOperator<[BSONNode, ...T]>,
  parse?: (...args: BSONNode[]) => T,
): void {
  if (operator.useParent !== undefined) {
    throw new Error('Double useParent assignment')
  }
  operator.useParent = true
  if (parse) {
    withParsing(operator, parse as any) // TODO: hacky
  }
}

export function parseOperatorArgs<T extends unknown[]>(
  operator: UpdateOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}
