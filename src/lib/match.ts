import { type BooleanNode, type BSONNode, NodeKind } from './node.js'

export interface MatchOperator<T extends unknown[] = unknown[]> {
  /**
   * Accepts the current document's value and the operator's argument.
   * Returns match (boolean) result.
   */
  (value: BSONNode, ...args: T): BooleanNode
  /**
   * Custom query arguments parsing function.
   * By default take the query as-is.
   */
  parse?: (...args: BSONNode[]) => T
}

export function withParsing<T extends unknown[]>(
  operator: MatchOperator<T>,
  parse: (...args: BSONNode[]) => T,
): void {
  if (operator.parse !== undefined) {
    throw new Error(
      `Match operator ${operator.name} cannot have multiple parsers`,
    )
  }
  operator.parse = parse
}

export function parseOperatorArgs<T extends unknown[]>(
  operator: MatchOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}

/**
 * Try direct value matching, otherwise try in-array matching.
 */
export function withArrayUnwrap<T extends unknown[]>(
  fn: MatchOperator<T>,
): MatchOperator<T> {
  const wrapped: MatchOperator<T> = (
    left: BSONNode,
    ...args: T
  ): BooleanNode => {
    let result = fn(left, ...args)

    if (!result.value && left.kind === NodeKind.ARRAY) {
      for (let i = 0; !result.value && i < left.value.length; i++) {
        result = fn(left.value[i], ...args)
      }
    }

    return result
  }

  if (fn.parse) {
    wrapped.parse = fn.parse
  } else {
    // Place a dummy parsing function to prevent out-of-order wrapping
    fn.parse = () => {
      throw new Error('Operator was wrapped')
    }
  }

  return wrapped
}
