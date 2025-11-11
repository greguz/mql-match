import { type BooleanNode, type BSONNode, NodeKind, nBoolean } from './node.js'

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
      if (value.kind === NodeKind.NULLISH && value.key !== undefined) {
        // Here we are trying to perform some match against a missing value.
        // Example: `{ quantity: { $lt: 20 } }`
        // This match must fail when "quantity" doesn't exist.
        // It's ok when `{ quantity: null }` tho.
        // This is different from the expression behaviour.
        //
        // TODO: also, this is not the correct place to do this check, probably :P
        return nBoolean(false)
      }

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
