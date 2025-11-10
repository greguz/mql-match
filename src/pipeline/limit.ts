import { unwrapNumber } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/
 */
export function $limit(arg: BSONNode): PipelineOperator {
  const message = 'Stage $limit expects limit a positive integer'

  const limit = unwrapNumber(arg, message)
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new TypeError(message)
  }

  return function* limitStage(docs) {
    let n = limit
    for (const doc of docs) {
      if (n > 0) {
        n--
        yield doc
      }
    }
  }
}
