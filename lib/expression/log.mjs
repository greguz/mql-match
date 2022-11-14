import Big from 'big.js'

import { isNumber } from '../util.mjs'

export function $log (expressions, compile) {
  if (!Array.isArray(expressions) || expressions.length !== 2) {
    throw new TypeError('Operator $log expects an array of two expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const [value, base] = fns.map(fn => fn(ctx.root, ctx))
    if (!isNumber(value) || value < 0) {
      throw new TypeError(`Expected number as value $log argument: ${value}`)
    }
    if (!isNumber(base) || base <= 1) {
      throw new TypeError(`Expected number as base $log argument: ${base}`)
    }
    if (base === Math.E) {
      return Math.log(value)
    } else if (base === 2) {
      return Math.log2(value)
    } else if (base === 10) {
      return Math.log10(value)
    } else {
      return Big(Math.log(value)).div(Math.log(base)).toNumber()
    }
  }
}

export function $ln (expression, compile) {
  return $log([expression, Math.E], compile)
}

export function $log10 (expression, compile) {
  return $log([expression, 10], compile)
}
