import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $divide (args, compile) {
  if (args.length !== 2) {
    throw new Error('Expression $divide takes exactly 2 arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [dividend, divisor] = fns.map(fn => fn(doc, ctx))

    if (isNullish(dividend) || isNullish(divisor)) {
      return null
    } else if (!isNumber(dividend) || !isNumber(divisor)) {
      throw new TypeError('Expression $divide only supports numeric types')
    } else if (n(divisor) === 0) {
      throw new Error("can't $divide by zero")
    } else {
      return Decimal.div(n(dividend), n(divisor)).toNumber()
    }
  }
}
