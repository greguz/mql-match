import {
  $eq as $eqStrict,
  $gt,
  $gte,
  $lt,
  $lte,
} from '../expression/comparison.js'
import { assertBSON } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
} from '../lib/node.js'
import { withQueryParsing } from '../lib/operator.js'

export { $gt, $gte, $lt, $lte }

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/eq/
 */
export function $eq(left: BSONNode, right: BSONNode): BooleanNode {
  let result = $eqLike(left, right)

  if (!result.value && left.kind === NodeKind.ARRAY) {
    for (let i = 0; i < left.value.length && !result.value; i++) {
      result = $eqLike(left.value[i], right)
    }
  }

  return result
}

/**
 * Part of filter query's "$eq" operator.
 *
 * https://www.mongodb.com/docs/manual/reference/operator/query/eq/
 */
function $eqLike(left: BSONNode, right: BSONNode): BooleanNode {
  if (right.kind === NodeKind.REGEX) {
    switch (left.kind) {
      case NodeKind.REGEX:
        return nBoolean(left.value.toString() === right.value.toString())
      case NodeKind.STRING:
        return nBoolean(right.value.test(left.value))
      default:
        return nBoolean(false)
    }
  }

  return $eqStrict(left, right)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/in/
 */
export function $in(valueNode: BSONNode, arrayNode: BSONNode): BooleanNode {
  const items = assertBSON(arrayNode, NodeKind.ARRAY).value

  for (let i = 0; i < items.length; i++) {
    const result = $eq(valueNode, items[i])
    if (result.value) {
      return result
    }
  }

  return nBoolean(false)
}

withQueryParsing<[BSONNode]>($in, arg => [
  assertBSON(arg, NodeKind.ARRAY, '$in needs an array'),
])
