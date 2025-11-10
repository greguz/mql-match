import type { BSONNode } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'
import { evalMatch, parseMatch } from '../match.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/
 */
export function $match(arg: BSONNode): PipelineOperator {
  const query = parseMatch(arg)

  return function* matchStage(docs) {
    for (const doc of docs) {
      if (evalMatch(query, doc).value) {
        yield doc
      }
    }
  }
}
