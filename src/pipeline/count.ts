import { assertBSON, wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, NodeKind, type StringNode } from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'

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

withStageParsing<[StringNode]>($count, arg => [
  assertBSON(arg, NodeKind.STRING),
])
