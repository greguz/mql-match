import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $round (args, compile) {
  if (args.length < 1 || args.length > 2) {
    throw new Error(
      'Expression $round takes at least 1 argument, and at most 2'
    )
  }

  const getValue = compile(args[0])
  const getPlace = compile(args[1] || 0)

  return (doc, ctx) => {
    const value = n(getValue(doc, ctx))
    const place = n(getPlace(doc, ctx))

    if (isNullish(value) || isNullish(place)) {
      return null
    } else if (!isNumber(value) || !isNumber(place)) {
      throw new TypeError('Expression $round only supports numeric types')
    } else if (!isPlace(place)) {
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
}

function isPlace (value) {
  return Number.isInteger(value) && value > -20 && value < 100
}
