import {
  type BooleanNode,
  nBoolean,
  type ValueNode,
  withArguments,
} from '../node.js'
import { $toBool } from './type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/and/
 */
export function $and(...args: ValueNode[]): BooleanNode {
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
export function $not(arg: ValueNode): ValueNode {
  return nBoolean(!$toBool(arg).value)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/or/
 */
export function $or(...args: ValueNode[]): ValueNode {
  let result = false
  for (let i = 0; i < args.length && !result; i++) {
    result = $toBool(args[i]).value === true
  }
  return nBoolean(result)
}

withArguments($or, 0, Number.POSITIVE_INFINITY)
