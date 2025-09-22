import { Decimal } from 'decimal.js'

import { type BSONNode, NodeKind, nDouble, nNullish } from '../lib/node.js'
import { withArguments } from '../lib/operator.js'

/**
 *
 */
export function $abs(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $add(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $ceil(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $divide(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $exp(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $floor(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $log(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $mod(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/
 */
export function $multiply(args: BSONNode[]): BSONNode {
  if (!args.length) {
    return nDouble(1)
  }

  let result = Decimal(1)

  for (const arg of args) {
    if (arg.kind === NodeKind.NULLISH) {
      return nNullish()
    }
    if (arg.kind !== NodeKind.DOUBLE) {
      throw new TypeError(`Values of kind ${arg.kind} cannot be multiplied`)
    }
    if (Number.isNaN(arg.value)) {
      return nDouble(Number.NaN)
    }
    result = result.times(arg.value)
  }

  return nDouble(result.toNumber())
}

withArguments($multiply, 0, Number.POSITIVE_INFINITY)

/**
 *
 */
export function $pow(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $round(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $sqrt(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $subtract(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $trunc(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $log10(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $ln(args: BSONNode[]): BSONNode {
  throw new Error('TODO')
}
