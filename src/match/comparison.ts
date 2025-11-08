import {
  $eq as $eqStrict,
  $gte as $gteStrict,
  $gt as $gtStrict,
  $lte as $lteStrict,
  $lt as $ltStrict,
} from '../expression/comparison.js'
import { assertBSON } from '../lib/bson.js'
import { withArrayUnwrap, withParsing } from '../lib/match.js'
import {
  type ArrayNode,
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
} from '../lib/node.js'

export const $eq = withArrayUnwrap($eqStrict)

export const $gt = withArrayUnwrap($gtStrict)

export const $gte = withArrayUnwrap($gteStrict)

export const $lt = withArrayUnwrap($ltStrict)

export const $lte = withArrayUnwrap($lteStrict)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/in/
 */
export function $in(valueNode: BSONNode, arrayNode: ArrayNode): BooleanNode {
  for (const item of arrayNode.value) {
    let result = false
    if (item.kind !== NodeKind.REGEX) {
      result = $eq(valueNode, item).value
    } else if (valueNode.kind === NodeKind.STRING) {
      item.value.test(valueNode.value)
    }

    if (result) {
      return nBoolean(result)
    }
  }

  return nBoolean(false)
}

withParsing<[ArrayNode]>($in, arg => [
  assertBSON(arg, NodeKind.ARRAY, '$in needs an array'),
])
