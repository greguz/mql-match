import { unwrapNumber } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/skip/
 */
export function $skip(arg: BSONNode): PipelineOperator {
  const message = 'Stage $skip expects a positive integer or zero'

  const skip = unwrapNumber(arg, message)
  if (!Number.isInteger(skip) || skip < 0) {
    throw new TypeError(message)
  }

  return function* skipStage(docs) {
    let n = skip
    for (const doc of docs) {
      if (n > 0) {
        n--
      } else {
        yield doc
      }
    }
  }
}
