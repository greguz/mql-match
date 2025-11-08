import { withArguments } from '../lib/expression.js'
import { type BooleanNode, type BSONNode, nBoolean } from '../lib/node.js'
import { $toBool } from './type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/and/
 */
export function $and(...args: BSONNode[]): BooleanNode {
  let result = true
  for (let i = 0; i < args.length && result; i++) {
    result = $toBool(args[i]).value === true
  }
  return nBoolean(result)
}

withArguments($and, 0, Number.POSITIVE_INFINITY)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/not/
 */
export function $not(arg: BSONNode): BSONNode {
  return nBoolean(!$toBool(arg).value)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/or/
 */
export function $or(...args: BSONNode[]): BSONNode {
  let result = false
  for (let i = 0; i < args.length && !result; i++) {
    result = $toBool(args[i]).value === true
  }
  return nBoolean(result)
}

withArguments($or, 0, Number.POSITIVE_INFINITY)
