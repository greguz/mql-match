import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import {
  isArray,
  isInfinity,
  isInteger,
  isNullish,
  isNumber
} from '../util.mjs'

const OperatorError = declareOperatorError('$round')

export function $round (arg, compile) {
  if (!isArray(arg) || arg.length < 1 || arg.length > 2) {
    throw new OperatorError(
      'Operator $round expects an array of one or two expressions',
      { argument: arg }
    )
  }

  const getValue = compile(arg[0])
  const getPlace = compile(arg[1] || 0)

  return (doc, ctx) => {
    const value = getValue(doc, ctx)

    const place = getPlace(doc, ctx) || 0
    if (!isPlace(place)) {
      throw new OperatorError(
        'Operator $round expects a valid place value',
        {
          argument: arg,
          document: doc,
          value: place
        }
      )
    }

    if (isNullish(value)) {
      return null
    } else if (isInfinity(value)) {
      return value
    } else if (isNumber(value)) {
      return Big(value).round(place, Big.roundHalfEven).toNumber()
    } else {
      return NaN
    }
  }
}

function isPlace (value) {
  return isInteger(value) && value > -20 && value < 100
}
