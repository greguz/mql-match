import { unwrapNumber } from '../lib/bson.js'
import type { MatchOperator } from '../lib/match.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
} from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/size/
 */
export function $size(arg: BSONNode): MatchOperator {
  const n = unwrapNumber(
    arg,
    `Failed to parse $size: expected a number (got ${arg.kind})`,
  )
  if (!Number.isInteger(n)) {
    throw new TypeError(`Failed to parse $size: expected an integer (got ${n})`)
  }
  if (n < 0) {
    throw new TypeError(
      `Failed to parse $size: expected a non-negative number (got ${n})`,
    )
  }

  return (value: BSONNode): BooleanNode => {
    return nBoolean(
      value.kind === NodeKind.ARRAY ? value.value.length === arg.value : false,
    )
  }
}
