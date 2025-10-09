import { assertBSON, unwrapDecimal } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nDouble,
} from '../lib/node.js'
import { withParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/size/
 */
export function $size(left: BSONNode, right: BSONNode): BooleanNode {
  const size = assertBSON(right, NodeKind.DOUBLE).value
  return nBoolean(
    left.kind === NodeKind.ARRAY ? left.value.length === size : false,
  )
}

withParsing($size, arg => {
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
  return [nDouble(n)]
})
