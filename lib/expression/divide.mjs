import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import { isArray, isInfinity, isNullish, isNumber, isZero } from '../util.mjs'

const OperatorError = declareOperatorError('$divide')

export function $divide (arg, compile) {
  if (!isArray(arg) || arg.length !== 2) {
    throw new OperatorError(
      'Operator $divide expects an array of two expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const [dividend, divisor] = fns.map(fn => fn(doc, ctx))
    if (isNullish(dividend) || isNullish(divisor)) {
      return null
    }
    if (!isNumber(divisor) || isZero(divisor)) {
      throw new OperatorError(
        'Operator $divide expects a non-zero number as divisor',
        {
          argument: arg,
          document: doc,
          value: divisor
        }
      )
    }

    if (isInfinity(dividend)) {
      // Both values are NOT zero, "sign" function is safe
      return sign(dividend) === sign(divisor)
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY
    } else if (isNumber(dividend)) {
      return Big(dividend).div(divisor).toNumber()
    } else {
      throw new OperatorError(
        'Operator $divide expects a numeric value as dividend',
        {
          argument: arg,
          document: doc,
          value: dividend
        }
      )
    }
  }
}

function sign (value) {
  return value < 0 ? '-' : '+'
}
