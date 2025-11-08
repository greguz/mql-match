import { wrapNodes } from '../lib/bson.js'
import { withArguments } from '../lib/expression.js'
import {
  type ArrayNode,
  type BooleanNode,
  type BSONNode,
  type DoubleNode,
  NodeKind,
  type NullishNode,
  nBoolean,
  nDouble,
  nNullish,
} from '../lib/node.js'
import { $eq } from './comparison.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/concatArrays/
 */
export function $concatArrays(...args: BSONNode[]): ArrayNode | NullishNode {
  const result: BSONNode[] = []

  for (let i = 0; i < args.length; i++) {
    const node = args[i]
    if (node.kind === NodeKind.NULLISH) {
      return nNullish()
    }
    if (node.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$concatArrays operator expects arrays (got ${node.kind} at index ${i})`,
      )
    }
    result.push(...node.value)
  }

  return wrapNodes(result)
}

withArguments($concatArrays, 2, Number.POSITIVE_INFINITY)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/in/
 */
export function $in(spec: BSONNode, items: BSONNode): BooleanNode {
  if (items.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$in operator expects an array as second argument (got ${items.kind})`,
    )
  }

  let result = nBoolean(false)
  for (let i = 0; i < items.value.length && !result.value; i++) {
    result = $eq(spec, items.value[i])
  }

  return result
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/isArray/
 */
export function $isArray(arg: BSONNode): BooleanNode {
  return nBoolean(arg.kind === NodeKind.ARRAY)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/
 */
export function $size(arg: BSONNode): DoubleNode {
  if (arg.kind !== NodeKind.ARRAY) {
    throw new TypeError(`$size operator expects an array (got ${arg.kind})`)
  }
  return nDouble(arg.value.length)
}
