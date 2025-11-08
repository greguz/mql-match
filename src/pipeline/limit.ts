import { unwrapNumber } from '../lib/bson.js'
import { type BSONNode, type DoubleNode, nDouble } from '../lib/node.js'
import { withParsing } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/
 */
export function* $limit(
  docs: Iterable<BSONNode>,
  limit: DoubleNode,
): Iterable<BSONNode> {
  let n = limit.value
  for (const doc of docs) {
    if (n > 0) {
      n--
      yield doc
    }
  }
}

withParsing($limit, arg => {
  const message = 'Stage $limit expects limit a positive integer'
  const n = unwrapNumber(arg, message)
  if (!Number.isInteger(n) || n <= 0) {
    throw new TypeError(message)
  }
  return [nDouble(n)] as const
})
