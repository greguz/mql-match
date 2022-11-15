import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import {
  isArray,
  isInfinity,
  isInteger,
  isNullish,
  isNumber
} from '../util.mjs'

const OperatorError = declareOperatorError('$trunc')

export function $trunc (arg, compile) {
  if (!isArray(arg) || arg.length < 1 || arg.length > 2) {
    throw new OperatorError(
      'Operator $truc expects an array of one or two expressions',
      { arguemnt: arg }
    )
  }

  const getValue = compile(arg[0])
  const getPlace = compile(arg[1] || 0)

  return (doc, ctx) => {
    const value = getValue(doc, ctx)

    const place = getPlace(doc, ctx) ?? 0
    if (!isInteger(place) || place <= -20 || place >= 100) {
      throw new OperatorError(
        'Operator $truc expects a valid place value',
        {
          arguemnt: arg,
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
      return Big(value).round(place, Big.roundDown).toNumber()
    } else {
      return NaN
    }
  }
}
