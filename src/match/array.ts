import { assertBSON, unwrapDecimal } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nDouble,
} from '../lib/node.js'
import { withQueryParsing } from '../lib/operator.js'
import { $eq } from './comparison.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/size/
 */
export function $size(left: BSONNode, right: BSONNode): BooleanNode {
  const size = assertBSON(right, NodeKind.DOUBLE).value
  return nBoolean(
    left.kind === NodeKind.ARRAY ? left.value.length === size : false,
  )
}

withQueryParsing($size, arg => {
  const n = unwrapDecimal(
    arg,
    `Failed to parse $size: expected a number (got ${arg.kind})`,
  )
  if (!n.isInteger()) {
    throw new TypeError(`Failed to parse $size: expected an integer (got ${n})`)
  }
  if (n.isNegative()) {
    throw new TypeError(
      `Failed to parse $size: expected a non-negative number (got ${n})`,
    )
  }
  return [nDouble(n)] as const
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/all/
 */
export function $all(left: BSONNode, right: BSONNode): BooleanNode {
  const values = assertBSON(right, NodeKind.ARRAY).value

  for (let i = 0; i < values.length; i++) {
    const result = $eq(left, values[i])
    if (!result.value) {
      return result
    }
  }

  return nBoolean(values.length > 0)
}

withQueryParsing<[BSONNode]>($all, arg => [
  assertBSON(arg, NodeKind.ARRAY, '$all needs an array'),
])
