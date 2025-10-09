import * as comparison from '../expression/comparison.js'
import { $regexMatch } from '../expression/string.js'
import { assertBSON } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nNullish,
} from '../lib/node.js'
import { type Operator, withArguments, withParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/eq/
 */
export function $eq(left: BSONNode, right: BSONNode): BooleanNode {
  if (right.kind === NodeKind.REGEX) {
    return $regexMatch(left, right, nNullish())
  }

  let result = comparison.$eq(left, right)

  // Special case when arrays are compared
  if (
    !result.value &&
    left.kind === NodeKind.ARRAY &&
    right.kind === NodeKind.ARRAY
  ) {
    for (let i = 0; i < left.value.length && !result.value; i++) {
      result = comparison.$eq(left.value[i], right)
    }
  }

  return result
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
