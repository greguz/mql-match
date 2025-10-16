import { parseExpression, resolveExpression } from '../expression.js'
import type { BSONNode, ExpressionNode } from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'

export function* $project(
  docs: Iterable<BSONNode>,
  expr: ExpressionNode,
): Iterable<BSONNode> {
  for (const doc of docs) {
    yield resolveExpression(expr, doc, doc)
  }
}

withStageParsing<[ExpressionNode]>($project, arg => [parseExpression(arg)])
