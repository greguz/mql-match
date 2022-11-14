import Big from 'big.js'

import { isArray, isDate, isNumber } from '../util.mjs'

export function $add (expressions, compile) {
  if (!isArray(expressions)) {
    throw new TypeError('Operator $add expects an array of expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const values = fns.map(fn => fn(ctx.root, ctx))
    let result = Big(0)
    for (const value of values) {
      if (isDate(value)) {
        result = result.plus(value.getTime())
      } else if (isNumber(value)) {
        result = result.plus(value)
      } else {
        throw new TypeError('Operator $add expects a number or a date')
      }
    }
    return values.length >= 1 && isDate(values[0])
      ? new Date(result.toNumber())
      : result.toNumber()
  }
}
