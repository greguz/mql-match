import type { BSONNode } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'
import { compileMatch } from '../match.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/
 */
export function $match(arg: BSONNode): PipelineOperator {
  const match = compileMatch(arg)

  return function* matchStage(docs) {
    for (const doc of docs) {
      if (match(doc).value) {
        yield doc
      }
    }
  }
}
