import { Decimal } from 'decimal.js'

import { type BSONNode, NodeKind, nDouble, nNullish } from '../lib/node.js'
import { withArguments } from '../lib/operator.js'

/**
 *
 */
export function $abs(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $add(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $ceil(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $divide(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $exp(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $floor(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $log(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $mod(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/
 */
export function $multiply(...args: BSONNode[]): BSONNode {
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
export function $pow(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $round(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $sqrt(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $subtract(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $trunc(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $log10(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $ln(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}
