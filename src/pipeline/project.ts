import { evalExpression, parseExpression } from '../expression.js'
import type { BSONNode, ExpressionNode } from '../lib/node.js'
import { withParsing } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/
 */
export function* $project(
  docs: Iterable<BSONNode>,
  expr: ExpressionNode,
): Iterable<BSONNode> {
  for (const doc of docs) {
    yield evalExpression(expr, doc)
  }
}

withParsing<[ExpressionNode]>($project, arg => [parseExpression(arg)])
