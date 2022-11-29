import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $pow (args, compile) {
  if (args.length !== 2) {
    throw new Error('Expression $pow takes exactly 2 arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [base, exponent] = fns.map(fn => fn(doc, ctx))

    if (isNullish(base) || isNullish(exponent)) {
      return null
    } else if (!isNumber(base) || !isNumber(exponent)) {
      throw new TypeError('Expression $pow only supports numeric types')
    } else {
      return Decimal.pow(n(base), n(exponent)).toNumber()
    }
  }
}
