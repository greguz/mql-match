import { evalExpression, parseExpression } from '../expression.js'
import type { BSONNode } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/
 */
export function $project(arg: BSONNode): PipelineOperator {
  const expr = parseExpression(arg)

  return function* projectStage(docs) {
    for (const doc of docs) {
      yield evalExpression(expr, doc)
    }
  }
}
