import { Decimal } from 'decimal.js'

import { unwrapDecimal, unwrapNumber, wrapBSON } from '../lib/bson.js'
import { withArguments } from '../lib/expression.js'
import {
  type BSONNode,
  type DoubleNode,
  NodeKind,
  nDate,
  nDouble,
  nInt,
  nLong,
  nNullish,
} from '../lib/node.js'

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
  // If first argument is a date, then the result type will be a date.
  const returnDate = args.length >= 1 && args[0].kind === NodeKind.DATE

  let result = Decimal(0)

  for (let i = 0; i < args.length && !result.isNaN(); i++) {
    if (args[i].kind === NodeKind.NULLISH) {
      return nNullish()
    }

    const n = unwrapDecimal(
      args[i],
      `$add only supports numeric or date types (got ${args[i].kind})`,
    )

    // When mixing Date and non-integer operands,
    // $add rounds the non-integer value to the nearest integer before performing the operation.
    if (returnDate && n.isFinite() && !n.isInteger()) {
      result = result.add(n.round())
    } else {
      result = result.add(n)
    }
  }

  if (returnDate && !result.isNaN()) {
    return nDate(new Date(result.toNumber()))
  }

  return nDouble(result)
}

withArguments($add, 0, Number.POSITIVE_INFINITY)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/
 */
export function $ceil(arg: BSONNode): BSONNode {
  if (arg.kind === NodeKind.NULLISH) {
    return arg
  }

  const n = unwrapDecimal(
    arg,
    `$ceil only supports numeric types (got ${arg.kind})`,
  )

  return nDouble(n.toDecimalPlaces(0, Decimal.ROUND_CEIL).toNumber())
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/
 */
export function $divide(
  dividendNode: BSONNode,
  divisorNode: BSONNode,
): BSONNode {
  if (
    dividendNode.kind === NodeKind.NULLISH ||
    divisorNode.kind === NodeKind.NULLISH
  ) {
    return nNullish()
  }

  const message = `$divide only supports numeric types (got ${dividendNode.kind} and ${divisorNode.kind})`
  const dividend = unwrapDecimal(dividendNode, message)
  const divisor = unwrapDecimal(divisorNode, message)
  if (divisor.isZero()) {
    throw new TypeError("can't $divide by zero")
  }

  return nDouble(dividend.div(divisor))
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
  const n = unwrapDecimal(
    arg,
    `$floor only supports numeric types (got ${arg.kind})`,
  )

  return nDouble(n.toDecimalPlaces(0, Decimal.ROUND_FLOOR))
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/
 */
export function $log(numberNode: BSONNode, baseNode: BSONNode): BSONNode {
  const n = unwrapNumber(
    numberNode,
    `$log's argument must be numeric (got ${numberNode.kind})`,
  )
  if (!Number.isFinite(n) || n < 0) {
    throw new TypeError(`$log's argument must be a positive number (got ${n})`)
  }

  const base = unwrapNumber(
    baseNode,
    `$log's base must be numeric (got ${baseNode.kind})`,
  )
  if (!Number.isFinite(base) || base <= 1) {
    throw new TypeError(
      `$log's base must be a positive number not equal to 1 (got ${base})`,
    )
  }

  // Special case to support standard constants
  if (n === Math.E && base === Math.E) {
    return nDouble(1)
  }

  switch (base) {
    case 2:
      return nDouble(Decimal.log2(n))
    case 10:
      return nDouble(Decimal.log10(n))
    case Math.E:
      return nDouble(Decimal.ln(n))
    default:
      return nDouble(Decimal.log(n, base))
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/
 */
export function $log10(arg: BSONNode): BSONNode {
  return $log(arg, wrapBSON(10))
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ln/
 */
export function $ln(arg: BSONNode): BSONNode {
  return $log(arg, wrapBSON(Math.E))
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
  const n = unwrapDecimal(
    numberNode,
    `$pow's base must be numeric (got ${numberNode.kind})`,
  )
  const e = unwrapDecimal(
    exponentNode,
    `$pow's exponent must be numeric (${exponentNode.kind})`,
  )
  if (n.isZero() && e.isNegative()) {
    throw new TypeError('$pow cannot take a base of 0 and a negative exponent')
  }

  return nDouble(n.pow(e))
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/
 */
export function $round(numberNode: BSONNode, placeNode: BSONNode): BSONNode {
  if (numberNode.kind === NodeKind.NULLISH) {
    return numberNode
  }

  const n = unwrapDecimal(
    numberNode,
    `$round only supports numeric types (got ${numberNode.kind})`,
  )

  const place = unwrapPlace(placeNode, '$round')
  if (place >= 0) {
    return nDouble(n.toDecimalPlaces(place, Decimal.ROUND_HALF_EVEN))
  }

  const factor = new Decimal(10).pow(-place)

  return nDouble(
    n
      .div(factor)
      .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
      .times(factor)
      .toNumber(),
  )
}

withArguments($round, 1, 2)

/**
 * An integer between -20 and 100, exclusive.
 * Defaults to zero.
 */
function unwrapPlace(node: BSONNode, operator: string): number {
  if (node.kind === NodeKind.NULLISH) {
    return 0
  }
  const place = unwrapNumber(
    node,
    `${operator} precision must be a numeric value (got ${node.kind})`,
  )
  if (!Number.isInteger(place)) {
    throw new TypeError(
      `precision argument to ${operator} must be a integral value`,
    )
  }
  if (place < -20 || place > 100) {
    throw new TypeError(
      `cannot apply ${operator} with precision value -500 value must be in [-20, 100]`,
    )
  }
  return place
}

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
  if (left.kind === NodeKind.NULLISH || right.kind === NodeKind.NULLISH) {
    return nNullish()
  }

  const message = `can't $subtract ${right.kind} from ${left.kind}`
  const l = unwrapDecimal(left, message)
  const r = unwrapDecimal(right, message)
  if (right.kind === NodeKind.DATE && left.kind !== NodeKind.DATE) {
    throw new TypeError(message)
  }

  const result = l.minus(r)

  // TODO: round "right" when "left" is date

  // date - date = milliseconds
  // date - milliseconds = date
  // otherwise "number"
  return left.kind === NodeKind.DATE && right.kind !== NodeKind.DATE
    ? nDate(new Date(result.toNumber()))
    : nDouble(result)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/trunc/
 */
export function $trunc(numberNode: BSONNode, placeNode: BSONNode): BSONNode {
  if (numberNode.kind === NodeKind.NULLISH) {
    return numberNode
  }

  const n = unwrapDecimal(
    numberNode,
    `$trunc only supports numeric types (got ${numberNode.kind})`,
  )

  const place = unwrapPlace(placeNode, '$trunc')
  if (place >= 0) {
    return nDouble(n.toDecimalPlaces(place, Decimal.ROUND_DOWN))
  }

  const factor = new Decimal(10).pow(-place)

  return nDouble(
    n
      .div(factor)
      .toDecimalPlaces(0, Decimal.ROUND_DOWN)
      .times(factor)
      .toNumber(),
  )
}

withArguments($trunc, 1, 2)
