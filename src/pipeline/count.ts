import { assertBSON, wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, NodeKind, type StringNode } from '../lib/node.js'
import { withParsing } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/count/
 */
export function* $count(
  docs: Iterable<BSONNode>,
  key: StringNode,
): Iterable<BSONNode> {
  let count = 0
  for (const _ of docs) {
    count++
  }

  yield wrapObjectRaw({ [key.value]: count })
}

withParsing<[StringNode]>($count, arg => [assertBSON(arg, NodeKind.STRING)])
