import Big from 'big.js'

import { isInfinity, isNullish, isNumber } from '../util.mjs'

export function $floor (arg, compile) {
  const map = compile(arg)

  return (doc, ctx) => {
    const value = map(doc, ctx)

    if (isNullish(value)) {
      return null
    } else if (isInfinity(value)) {
      return value
    } else if (isNumber(value)) {
      return Big(value)
        .round(0, value < 0 ? Big.roundUp : Big.roundDown)
        .toNumber()
    } else {
      return NaN
    }
  }
}
