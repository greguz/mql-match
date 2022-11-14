import Big from 'big.js'

import { isInfinity, isNullish, isNumber } from '../util.mjs'

export function $sqrt (expression, compile) {
  const map = compile(expression)
  return (doc, ctx) => {
    const value = map(ctx.root, ctx)
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
