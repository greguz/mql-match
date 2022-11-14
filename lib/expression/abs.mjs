import { isInfinity, isNullish, isNumber } from '../util.mjs'

export function $abs (expression, compile) {
  const map = compile(expression)
  return (doc, ctx) => {
    const value = map(ctx.root, ctx)
    if (isNullish(value)) {
      return null
    } else if (isInfinity(value) || isNumber(value)) {
      return Math.abs(value)
    } else {
      return NaN
    }
  }
}
