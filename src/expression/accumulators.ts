import { Decimal } from 'decimal.js'

import { isBSONNumber, unwrapNumber } from '../lib/bson.js'
import { type BSONNode, nDouble, nNullish } from '../lib/node.js'
import { withArguments } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/
 */
export function $sum(...args: BSONNode[]): BSONNode {
  let result = Decimal(0)

  for (let i = 0; i < args.length && !result.isNaN(); i++) {
    if (isBSONNumber(args[i])) {
      result = result.add(unwrapNumber(args[i]))
    }
  }

  return nDouble(result)
}

withArguments($sum, 0, Number.POSITIVE_INFINITY)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/
 */
export function $avg(...args: BSONNode[]): BSONNode {
  let found = false
  let total = Decimal(0)

  for (let i = 0; i < args.length && !total.isNaN(); i++) {
    if (isBSONNumber(args[i])) {
      found = true
      total = total.add(unwrapNumber(args[i]))
    }
  }

  if (!found) {
    return nNullish()
  }

  return nDouble(total.div(args.length))
}

withArguments($avg, 0, Number.POSITIVE_INFINITY)
