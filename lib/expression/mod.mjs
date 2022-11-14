import Big from 'big.js'

import { isNumber } from '../util.mjs'

export function $mod (expressions, compile) {
  if (!Array.isArray(expressions) || expressions.length !== 2) {
    throw new TypeError('Operator $mod expects an array of two expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const [dividend, divisor] = fns.map(fn => fn(ctx.root, ctx))
    if (!isNumber(dividend)) {
      throw new TypeError(`Invalid $mod dividend: ${dividend}`)
    }
    if (!isNumber(divisor)) {
      throw new TypeError(`Invalid $mod divisor: ${divisor}`)
    }
    return Big(dividend).mod(divisor).toNumber()
  }
}
