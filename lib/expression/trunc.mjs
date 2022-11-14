import Big from 'big.js'

import { isArray, isInfinity, isInteger, isNullish, isNumber } from '../util.mjs'

export function $trunc (specs, compile) {
  if (!isArray(specs) || specs.length < 1 || specs.length > 2) {
    throw new TypeError('Operator $truc expects an array of expressions')
  }

  const getValue = compile(specs[0])
  const getPlace = compile(specs[1] || 0)

  return (doc, ctx) => {
    const value = getValue(ctx.root, ctx)

    const place = getPlace(ctx.root, ctx) ?? 0
    if (!isInteger(place) || place <= -20 || place >= 100) {
      throw new TypeError(`Invalid place argument for $rount operator: ${place}`)
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
