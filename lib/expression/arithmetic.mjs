import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { bind, isDate, isNullish } from '../util.mjs'

function abs (values) {
  return Decimal.abs(n(values[0])).toNumber()
}

function add (values) {
  const result = values.reduce(
    (acc, value) => acc.plus(isDate(value) ? value.getTime() : n(value)),
    Decimal(0)
  )

  return values.length >= 1 && isDate(values[0])
    ? new Date(result.toNumber())
    : result.toNumber()
}

function ceil (values) {
  return Decimal(n(values[0]))
    .toDecimalPlaces(0, Decimal.ROUND_CEIL)
    .toNumber()
}

function divide (values) {
  const dividend = n(values[0])
  const divisor = n(values[1])
  if (divisor === 0) {
    throw new Error("can't $divide by zero")
  }
  return Decimal.div(dividend, divisor).toNumber()
}

function exp (values) {
  return Decimal(n(values[0])).naturalExponential().toNumber()
}

function floor (values) {
  return Decimal(n(values[0]))
    .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
    .toNumber()
}

function log (values) {
  const value = n(values[0])
  const base = n(values[1])

  switch (base) {
    case 2:
      return Decimal.log2(value).toNumber()
    case 10:
      return Decimal.log10(value).toNumber()
    case Math.E:
      return Decimal.ln(value).toNumber()
    default:
      return Decimal.log(value, base).toNumber()
  }
}

function mod (values) {
  const dividend = n(values[0])
  const divisor = n(values[1])
  return Decimal.mod(dividend, divisor).toNumber()
}

function multiply (values) {
  return values.reduce(
    (acc, value) => acc.times(n(value)),
    Decimal(1)
  ).toNumber()
}

function pow (values) {
  const [base, exponent] = values
  return Decimal.pow(n(base), n(exponent)).toNumber()
}

function round (values) {
  const value = n(values[0])
  const place = n(values[1] || 0)
  if (!isPlace(place)) {
    throw new TypeError(
      `cannot apply $round with precision value ${place} value must be in [-20, 100]`
    )
  }

  if (place < 0) {
    return Decimal(value)
      .toSignificantDigits(Math.abs(place), Decimal.ROUND_DOWN)
      .toNumber()
  } else {
    return Decimal(value)
      .toDecimalPlaces(place, Decimal.ROUND_HALF_EVEN)
      .toNumber()
  }
}

function sqrt (values) {
  return Decimal.sqrt(n(values[0])).toNumber()
}

function subtract (values) {
  const [left, right] = values

  const result = Decimal.sub(
    isDate(left) ? left.getTime() : n(left),
    isDate(right) ? right.getTime() : n(right)
  ).toNumber()

  return isDate(left) && !isDate(right)
    ? new Date(result)
    : result
}

function trunc (values) {
  const value = n(values[0])
  const place = n(values[1] || 0)
  if (!isPlace(place)) {
    throw new TypeError(
      `cannot apply $trunc with precision value ${place} value must be in [-20, 100]`
    )
  }
  if (place < 0) {
    return Decimal(value)
      .toSignificantDigits(Math.abs(place), Decimal.ROUND_DOWN)
      .toNumber()
  } else {
    return Decimal(value)
      .toDecimalPlaces(place, Decimal.ROUND_DOWN)
      .toNumber()
  }
}

function isPlace (value) {
  return Number.isInteger(value) && value > -20 && value < 100
}

function $operator (callback, args, compile, operator) {
  if (operator === '$round' || operator === '$trunc') {
    if (args.length < 1 || args.length > 2) {
      throw new Error(
        `Expression ${operator} takes at least 1 argument, and at most 2`
      )
    }
  } else if (
    operator === '$divide' ||
    operator === '$ln' ||
    operator === '$log' ||
    operator === '$log10' ||
    operator === '$mod' ||
    operator === '$pow' ||
    operator === '$subtract'
  ) {
    if (args.length !== 2) {
      throw new Error(`Expression ${operator} takes exactly 2 arguments`)
    }
  } else if (operator !== '$add' && operator !== '$multiply') {
    if (args.length !== 1) {
      throw new Error(`Expression ${operator} takes exactly 1 argument`)
    }
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const values = fns.map(fn => fn(doc, ctx))

    for (const value of values) {
      if (isNullish(value)) {
        return null
      } else if (!isNumber(value)) {
        if (operator !== '$add' && operator !== '$subtract') {
          throw new TypeError(
            `Expression ${operator} only supports numeric types`
          )
        } else if (!isDate(value)) {
          throw new TypeError(
            `Expression ${operator} only supports numeric or date types`
          )
        }
      }
    }

    return callback(values)
  }
}

export const $abs = bind($operator, abs)
export const $add = bind($operator, add)
export const $ceil = bind($operator, ceil)
export const $divide = bind($operator, divide)
export const $exp = bind($operator, exp)
export const $floor = bind($operator, floor)
export const $log = bind($operator, log)
export const $mod = bind($operator, mod)
export const $multiply = bind($operator, multiply)
export const $pow = bind($operator, pow)
export const $round = bind($operator, round)
export const $sqrt = bind($operator, sqrt)
export const $subtract = bind($operator, subtract)
export const $trunc = bind($operator, trunc)

export function $log10 (args, compile, operator) {
  if (args.length !== 1) {
    throw new Error(`Expression ${operator} takes exactly 1 argument`)
  }
  return $log([args[0], 10], compile, operator)
}

export function $ln (args, compile, operator) {
  if (args.length !== 1) {
    throw new Error(`Expression ${operator} takes exactly 1 argument`)
  }
  return $log([args[0], Math.E], compile, operator)
}
