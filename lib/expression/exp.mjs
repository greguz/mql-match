import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $exp (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $exp takes exactly 1 argument')
  }

  const map = compile(args[0])

  return (doc, ctx) => {
    const value = map(doc, ctx)

    if (isNullish(value)) {
      return null
    } else if (!isNumber(value)) {
      throw new TypeError('Expression $exp only supports numeric types')
    } else {
      return Decimal(n(value)).naturalExponential().toNumber()
    }
  }
}
