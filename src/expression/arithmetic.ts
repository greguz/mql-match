import { Decimal } from 'decimal.js'

import { unwrapDecimal, unwrapNumber } from '../lib/bson.js'
import {
  type BSONNode,
  type DoubleNode,
  NodeKind,
  nDouble,
  nExpression,
  nInt,
  nLong,
  nNullish,
} from '../lib/node.js'
import { withArguments, withParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/abs/
 */
export function $abs(arg: BSONNode): BSONNode {
  switch (arg.kind) {
    case NodeKind.NULLISH:
      return arg
    case NodeKind.DOUBLE:
      return nDouble(Math.abs(arg.value))
    case NodeKind.LONG:
      return arg.value.lt(0) ? nLong(arg.value.multiply(-1)) : arg
    case NodeKind.INT:
      return nInt(Math.abs(arg.value.value))
    default:
      throw new TypeError(`$abs doesn't support ${arg.kind} values`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/add/
 */
export function $add(...args: BSONNode[]): BSONNode {
  let result = Decimal(0)

  for (let i = 0; i < args.length && !result.isNaN(); i++) {
    if (args[i].kind === NodeKind.NULLISH) {
      return nNullish()
    }
    result = result.add(
      unwrapNumber(
        args[i],
        `$add only supports numeric or date types (got ${args[i].kind})`,
      ),
    )
  }

  return nDouble(result)
}

withArguments($add, 0, Number.POSITIVE_INFINITY)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/
 */
export function $ceil(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/
 */
export function $divide(dividend: BSONNode, divisor: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/
 */
export function $exp(arg: BSONNode): BSONNode {
  const n = unwrapDecimal(
    arg,
    `$exp only supports numeric types (got ${arg.kind})`,
  )

  return nDouble(n.naturalExponential())
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/
 */
export function $floor(arg: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/
 */
export function $log(numberNode: BSONNode, baseNode: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/mod/
 */
export function $mod(dividend: BSONNode, divisor: BSONNode): DoubleNode {
  const message = `$mod only supports numeric types, not ${dividend.kind} and ${divisor.kind}`
  return nDouble(
    Decimal.mod(
      unwrapNumber(dividend, message),
      unwrapNumber(divisor, message),
    ),
  )
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/
 */
export function $multiply(...args: BSONNode[]): BSONNode {
  let result = Decimal(1)

  for (let i = 0; i < args.length && !result.isNaN(); i++) {
    if (args[i].kind === NodeKind.NULLISH) {
      return nNullish()
    }
    result = result.times(
      unwrapNumber(
        args[i],
        `$multiply only supports numeric types (got ${args[i].kind})`,
      ),
    )
  }

  return nDouble(result)
}

withArguments($multiply, 0, Number.POSITIVE_INFINITY)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/pow/
 */
export function $pow(numberNode: BSONNode, exponentNode: BSONNode): BSONNode {
  throw new Error('TODO')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/
 */
export function $round(numberNode: BSONNode, placeNode: BSONNode): BSONNode {
  if (numberNode.kind === NodeKind.NULLISH) {
    return numberNode
  }

  const value = unwrapDecimal(
    numberNode,
    `$round only supports numeric types (got ${numberNode.kind})`,
  )

  const place = unwrapPlace(placeNode)

  if (place.lessThan(0)) {
    return nDouble(
      value.toSignificantDigits(place.abs().toNumber(), Decimal.ROUND_DOWN),
    )
  }

  return nDouble(
    value.toDecimalPlaces(place.toNumber(), Decimal.ROUND_HALF_EVEN),
  )
}

/**
 * An integer between -20 and 100, exclusive.
 * Defaults to zero.
 */
function unwrapPlace(node: BSONNode): Decimal {
  if (node.kind === NodeKind.NULLISH) {
    return Decimal(0)
  }
  const place = unwrapDecimal(
    node,
    `$round precision must be a numeric value (got ${node.kind})`,
  )
  if (!place.isInteger()) {
    throw new TypeError('precision argument to $round must be a integral value')
  }
  if (place.lessThan(-20) || place.greaterThan(100)) {
    throw new TypeError(
      'cannot apply $round with precision value -500 value must be in [-20, 100]',
    )
  }
  return place
}

withArguments($round, 1, 2)

withParsing($round, (numberNode, placeNode) => [
  nExpression(numberNode),
  nExpression(placeNode),
])

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/
 */
export function $sqrt(arg: BSONNode): BSONNode {
  if (arg.kind === NodeKind.NULLISH) {
    return arg
  }
  return nDouble(
    Decimal.sqrt(
      unwrapNumber(arg, `$sqrt only supports numeric types (got ${arg.kind})`),
    ),
  )
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/
 */
export function $subtract(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $subtract operator')
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
