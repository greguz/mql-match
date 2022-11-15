import Big from 'big.js'

import { isInfinity, isNullish, isNumber } from '../util.mjs'

export function $abs (arg, compile) {
  const map = compile(arg)

  return (doc, ctx) => {
    const value = map(doc, ctx)

    if (isNullish(value)) {
      return null
    } else if (isInfinity(value)) {
      return Number.POSITIVE_INFINITY
    } else if (isNumber(value)) {
      return Big(value).abs().toNumber()
    } else {
      return NaN
    }
  }
}
