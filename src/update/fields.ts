import { unwrapDecimal, unwrapNumber } from '../lib/bson.js'
import { type BSONNode, NodeKind, nDouble } from '../lib/node.js'
import { withParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/inc/
 */
export function $inc(left: BSONNode, right: BSONNode): BSONNode {
  if (left.kind === NodeKind.NULLISH) {
    return right
  }

  // TODO: error message
  return nDouble(unwrapDecimal(left).add(unwrapNumber(right)))
}

// TODO: error message
withParsing($inc, right => [nDouble(unwrapNumber(right))])
