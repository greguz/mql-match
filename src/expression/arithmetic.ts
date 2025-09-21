import { BSONType } from 'bson'
import { Decimal } from 'decimal.js'

import { nDouble, nNullish, type ValueNode, withArguments } from '../node.js'

/**
 *
 */
export function $abs(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $add(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $ceil(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $divide(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $exp(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $floor(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $log(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $mod(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/
 */
export function $multiply(...args: ValueNode[]): ValueNode {
  if (!args.length) {
    return nDouble(1)
  }

  let result = Decimal(1)

  for (const arg of args) {
    if (arg.kind === BSONType.null) {
      return nNullish()
    }
    if (arg.kind !== BSONType.double) {
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
export function $pow(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $round(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $sqrt(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $subtract(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $trunc(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $log10(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}

/**
 *
 */
export function $ln(arg: ValueNode): ValueNode {
  throw new Error('TODO')
}
