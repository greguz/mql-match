import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $mod (args, compile) {
  if (args.length !== 2) {
    throw new Error('Expression $mod takes at least 2 arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [dividend, divisor] = fns.map(fn => fn(doc, ctx))

    if (isNullish(dividend) || isNullish(divisor)) {
      return null
    } else if (!isNumber(dividend) || !isNumber(divisor)) {
      throw new TypeError('Expression $mod only supports numeric types')
    } else {
      return Decimal.mod(n(dividend), n(divisor)).toNumber()
    }
  }
}
