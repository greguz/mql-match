import { compileExpression } from '../expression.js'
import { setKey, wrapNodes, wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, NodeKind } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'
import { expected } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/
 */
export function $set(arg: BSONNode): PipelineOperator {
  const expr = compileExpression(arg)

  return function* setStage(docs) {
    for (const doc of docs) {
      yield mergeNodes(doc, expr(doc))
    }
  }
}

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
    if (!obj.keys.includes(key)) {
      setKey(obj, key, expected(target.value[key]))
    }
  }

  return obj
}
