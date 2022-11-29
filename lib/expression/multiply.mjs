import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $multiply (args, compile) {
  const fns = args.map(compile)

  return (doc, ctx) => {
    let result = Decimal(1)

    for (const fn of fns) {
      const value = fn(doc, ctx)

      if (isNullish(value)) {
        return null
      } else if (!isNumber(value)) {
        throw new TypeError('Expression $multiply only supports numeric types')
      } else {
        result = result.times(n(value))
      }
    }

    return result.toNumber()
  }
}
