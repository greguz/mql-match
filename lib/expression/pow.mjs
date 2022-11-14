import Big from 'big.js'

import { isNumber } from '../util.mjs'

export function $pow (expressions, compile) {
  if (!Array.isArray(expressions) || expressions.length !== 2) {
    throw new TypeError('Operator $pow expects an array of two expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const [value, exponent] = fns.map(fn => fn(ctx.root, ctx))
    if (!isNumber(value)) {
      throw new TypeError()
    }
    if (!isNumber(exponent)) {
      throw new TypeError()
    }
    if (exponent < 0 && value === 0) {
      throw new Error()
    }
    return Big(value).pow(exponent).toNumber()
  }
}
