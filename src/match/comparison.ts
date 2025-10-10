import * as comparison from '../expression/comparison.js'
import { assertBSON } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
} from '../lib/node.js'
import { type Operator, withArguments, withParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/eq/
 */
export function $eq(left: BSONNode, right: BSONNode): BooleanNode {
  let result = eqValue(left, right)

  if (!result.value && left.kind === NodeKind.ARRAY) {
    for (let i = 0; i < left.value.length && !result.value; i++) {
      result = eqValue(left.value[i], right)
    }
  }

  return result
}

function eqValue(left: BSONNode, right: BSONNode): BooleanNode {
  if (right.kind === NodeKind.REGEX) {
    switch (left.kind) {
      case NodeKind.REGEX:
        return nBoolean(left.value.toString() === right.value.toString())
      case NodeKind.STRING:
        return nBoolean(right.value.test(left.value))
      default:
        return nBoolean(false)
    }
  }

  return comparison.$eq(left, right)
}

withArguments($eq, 1)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/in/
 */
export function $in(valueNode: BSONNode, arrayNode: BSONNode): BooleanNode {
  const items = assertBSON(arrayNode, NodeKind.ARRAY).value

  for (let i = 0; i < items.length; i++) {
    const result = $eq(valueNode, items[i])
    if (result.value) {
      return result
    }
  }

  return nBoolean(false)
}

withParsing($in, arg => [assertBSON(arg, NodeKind.ARRAY, '$in needs an array')])

function castOperator(fn: Operator): Operator {
  const copy: Operator = fn.bind(null)

  const minArgs = fn.minArgs ?? fn.length
  const maxArgs = fn.maxArgs ?? minArgs

  copy.minArgs = minArgs - 1
  copy.maxArgs = maxArgs - 1

  return copy
}

export const $gt = castOperator(comparison.$gt)
export const $gte = castOperator(comparison.$gte)
export const $lt = castOperator(comparison.$lt)
export const $lte = castOperator(comparison.$lte)
