import { assertBSON, wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, NodeKind } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/count/
 */
export function $count(arg: BSONNode): PipelineOperator {
  const key = assertBSON(arg, NodeKind.STRING).value

  return function* countStage(docs) {
    let count = 0
    for (const _ of docs) {
      count++
    }

    yield wrapObjectRaw({ [key]: count })
  }
}
