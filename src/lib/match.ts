import { type BooleanNode, type BSONNode, NodeKind } from './node.js'

/**
 * Returns the match result against a single value.
 */
export type MatchOperator = (value: BSONNode) => BooleanNode

/**
 * Pass an argument and returns the operator function.
 */
export type MatchOperatorConstructor = (arg: BSONNode) => MatchOperator

/**
 * Try direct value matching, otherwise try in-array matching.
 */
export function withArrayUnwrap(
  $operator: MatchOperatorConstructor,
): MatchOperatorConstructor {
  return (arg: BSONNode): MatchOperator => {
    const fn = $operator(arg)

    return (value: BSONNode): BooleanNode => {
      let result = fn(value)

      if (!result.value && value.kind === NodeKind.ARRAY) {
        for (let i = 0; !result.value && i < value.value.length; i++) {
          result = fn(value.value[i])
        }
      }

      return result
    }
  }
}
