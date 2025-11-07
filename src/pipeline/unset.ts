import { evalExpression, parseExpression } from '../expression.js'
import { wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, type ExpressionNode, NodeKind } from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/unset/
 */
export function* $unset(
  docs: Iterable<BSONNode>,
  expr: ExpressionNode,
): Iterable<BSONNode> {
  for (const doc of docs) {
    yield evalExpression(expr, doc)
  }
}

withStageParsing<[ExpressionNode]>($unset, arg => {
  if (arg.kind === NodeKind.STRING) {
    return [parseExpression(wrapObjectRaw({ [arg.value]: 0 }))]
  }
  if (arg.kind !== NodeKind.ARRAY) {
    throw new TypeError('$unset specification must be a string or an array')
  }

  const obj: Record<string, unknown> = {}

  for (const item of arg.value) {
    if (item.kind !== NodeKind.STRING) {
      throw new TypeError(
        '$unset specification must be a string or an array containing only string values',
      )
    }
    obj[item.value] = 0
  }

  return [parseExpression(wrapObjectRaw(obj))]
})
