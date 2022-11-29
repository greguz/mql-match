import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isDate, isNullish } from '../util.mjs'

export function $add (args, compile) {
  const fns = args.map(compile)

  return (doc, ctx) => {
    const values = fns.map(fn => fn(doc, ctx))

    let result = Decimal(0)

    for (const value of values) {
      if (isNullish(value)) {
        return null
      } else if (!isDate(value) && !isNumber(value)) {
        throw new TypeError('Expression $add only supports numeric or date types')
      } else {
        result = result.plus(
          isDate(value)
            ? value.getTime()
            : n(value)
        )
      }
    }

    return values.length >= 1 && isDate(values[0])
      ? new Date(result.toNumber())
      : result.toNumber()
  }
}
