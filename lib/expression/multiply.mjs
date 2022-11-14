import Big from 'big.js'

import { isArray, isNumber } from '../util.mjs'

export function $multiply (expressions, compile) {
  if (!isArray(expressions)) {
    throw new TypeError('Operator $multiply expects an array of expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const values = fns.map(fn => fn(ctx.root, ctx))
    let result = Big(1)
    for (const value of values) {
      if (isNumber(value)) {
        result = result.times(value)
      } else {
        throw new TypeError('Operator $multiply expects a number')
      }
    }
    return result.toNumber()
  }
}
