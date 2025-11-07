import { evalExpression, parseExpression } from '../expression.js'
import { setKey, wrapNodes, wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, type ExpressionNode, NodeKind } from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'
import { expected, includes } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/
 */
export function* $set(
  docs: Iterable<BSONNode>,
  expr: ExpressionNode,
): Iterable<BSONNode> {
  for (const doc of docs) {
    yield mergeNodes(doc, evalExpression(expr, doc))
  }
}

withStageParsing<[ExpressionNode]>($set, arg => [parseExpression(arg)])

function mergeNodes(target: BSONNode, source: BSONNode): BSONNode {
  if (target.kind === NodeKind.ARRAY && source.kind !== NodeKind.ARRAY) {
    return wrapNodes(target.value.map(n => mergeNodes(n, source)))
  }
  if (target.kind !== NodeKind.OBJECT || source.kind !== NodeKind.OBJECT) {
    return source // expression value wins
  }

  const obj = wrapObjectRaw()

  for (const key of source.keys) {
    const collision = target.value[key]
    setKey(
      obj,
      key,
      collision
        ? mergeNodes(collision, expected(source.value[key]))
        : expected(source.value[key]),
    )
  }

  for (const key of target.keys) {
    if (!includes(obj.keys, key)) {
      setKey(obj, key, expected(target.value[key]))
    }
  }

  return obj
}
