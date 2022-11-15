import Big from 'big.js'

import { isNullish, isNumber } from '../util.mjs'

export function $sqrt (arg, compile) {
  const map = compile(arg)

  return (doc, ctx) => {
    const value = map(doc, ctx)

    if (isNullish(value)) {
      return null
    } else if (value === Number.POSITIVE_INFINITY) {
      return Number.POSITIVE_INFINITY
    } else if (isNumber(value) && value >= 0) {
      return Big(value).sqrt().toNumber()
    } else {
      return NaN
    }
  }
}
