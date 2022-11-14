import Big from 'big.js'

import { isArray, isNumber } from '../util.mjs'

export function $divide (expressions, compile) {
  if (!isArray(expressions) || expressions.length !== 2) {
    throw new TypeError('Operator $divide expects an array of two expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const [dividend, divisor] = fns.map(fn => fn(ctx.root, ctx))
    if (!isNumber(dividend)) {
      throw new TypeError('Operator $divide expects a numeric dividend')
    }
    if (!isNumber(divisor)) {
      throw new TypeError('Operator $divide expects a numeric divisor')
    }
    return Big(dividend).div(divisor).toNumber()
  }
}
