import Big from 'big.js'

import { isDate, isNumber } from '../util.mjs'

export function $subtract (expressions, compile) {
  if (!Array.isArray(expressions) || expressions.length !== 2) {
    throw new TypeError('Operator $subtract expects an array of two expressions')
  }
  const fns = expressions.map(compile)
  return (doc, ctx) => {
    const [first, second] = fns.map(fn => fn(ctx.root, ctx))
    if (!isDate(first) && !isNumber(first)) {
      throw new TypeError(`Expected date or number as first $subtract argument: ${first}`)
    }
    if (!isDate(second) && !isNumber(second)) {
      throw new TypeError(`Expected date or number as second $subtract argument: ${second}`)
    }

    const result = Big(
      isDate(first) ? first.getTime() : first
    ).minus(
      isDate(second) ? second.getTime() : second
    )

    return isDate(first) && !isDate(second)
      ? new Date(result.toNumber())
      : result.toNumber()
  }
}
