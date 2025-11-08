import { unwrapDecimal } from '../lib/bson.js'
import { withParsing } from '../lib/match.js'
import {
  type BooleanNode,
  type BSONNode,
  type DoubleNode,
  NodeKind,
  nBoolean,
  nDouble,
} from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/size/
 */
export function $size(left: BSONNode, right: DoubleNode): BooleanNode {
  return nBoolean(
    left.kind === NodeKind.ARRAY ? left.value.length === right.value : false,
  )
}

withParsing<[DoubleNode]>($size, arg => {
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
