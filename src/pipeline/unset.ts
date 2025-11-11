import { compileExpression, type Expression } from '../expression.js'
import { wrapObjectRaw } from '../lib/bson.js'
import { type BSONNode, NodeKind } from '../lib/node.js'
import type { PipelineOperator } from '../lib/pipeline.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/unset/
 */
export function $unset(arg: BSONNode): PipelineOperator {
  const expr = parseArgument(arg)

  return function* unsetStage(docs) {
    for (const doc of docs) {
      yield expr(doc)
    }
  }
}

function parseArgument(arg: BSONNode): Expression {
  if (arg.kind === NodeKind.STRING) {
    return compileExpression(wrapObjectRaw({ [arg.value]: 0 }))
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

  return compileExpression(wrapObjectRaw(obj))
}
