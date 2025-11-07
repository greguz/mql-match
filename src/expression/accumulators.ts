import { Decimal } from 'decimal.js'

import { isBSONNumber, unwrapNumber, wrapNodes } from '../lib/bson.js'
import { withArguments, withParsing } from '../lib/expression.js'
import { type BSONNode, NodeKind, nDouble, nNullish } from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/
 */
export function $sum(arg: BSONNode): BSONNode {
  let result = Decimal(0)

  if (arg.kind === NodeKind.ARRAY) {
    for (let i = 0; i < arg.value.length && !result.isNaN(); i++) {
      if (isBSONNumber(arg.value[i])) {
        result = result.add(unwrapNumber(arg.value[i]))
      }
    }
  }

  return nDouble(result)
}

withArguments($sum, 0, Number.POSITIVE_INFINITY)

withParsing($sum, (...args) => {
  switch (args.length) {
    case 0:
      return [wrapNodes([])]
    case 1:
      return args
    default:
      return [wrapNodes(args)]
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/avg/
 */
export function $avg(arg: BSONNode): BSONNode {
  let length = -1
  let total = Decimal(0)

  if (arg.kind === NodeKind.ARRAY) {
    length = arg.value.length
    for (let i = 0; i < length && !total.isNaN(); i++) {
      if (isBSONNumber(arg.value[i])) {
        total = total.add(unwrapNumber(arg.value[i]))
      }
    }
  }

  if (length < 0) {
    return nNullish()
  }

  return nDouble(total.div(length))
}

withArguments($avg, 0, Number.POSITIVE_INFINITY)

withParsing($avg, (...args) => {
  switch (args.length) {
    case 0:
      return [wrapNodes([])]
    case 1:
      return args
    default:
      return [wrapNodes(args)]
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/stdDevPop/
 */
export function $stdDevPop(...args: BSONNode[]): BSONNode {
  // TODO
  // function populationStandardDeviation(values: number[]) {
  //   const N = values.length
  //   if (N === 0) return 0
  //   const mean = values.reduce((sum, val) => sum + val, 0) / N
  //   const variance =
  //     values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / N
  //   return Math.sqrt(variance)
  // }
  // const data = [10, 12, 23, 23, 16, 23, 21, 16]
  // console.log(populationStandardDeviation(data)) // 4.898979485566356
  throw new Error('TODO: $stdDevPop')
}

withArguments($stdDevPop, 0, Number.POSITIVE_INFINITY)
