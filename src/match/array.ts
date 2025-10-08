import { assertBSON } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nDouble,
} from '../lib/node.js'
import { withParsing } from '../lib/operator.js'

export function $size(left: BSONNode, right: BSONNode): BooleanNode {
  const size = assertBSON(right, NodeKind.DOUBLE).value
  return nBoolean(
    left.kind === NodeKind.ARRAY ? left.value.length === size : false,
  )
}

withParsing($size, arg => {
  let size: number
  switch (arg.kind) {
    case NodeKind.DOUBLE:
      size = arg.value
      break
    case NodeKind.INT:
      size = arg.value.value
      break
    case NodeKind.LONG:
      size = arg.value.toNumber()
      break
    default:
      throw new TypeError(
        `Failed to parse $size: expected a number (got ${arg.kind})`,
      )
  }

  if (!Number.isInteger(size)) {
    throw new TypeError(
      `Failed to parse $size: expected an integer (got ${size})`,
    )
  }
  if (size < 0) {
    throw new TypeError(
      `Failed to parse $size: expected a non-negative number (got ${size})`,
    )
  }

  return [nDouble(size)]
})
