import { isNullish, isNumber } from '../util.mjs'

export function $exp (expression, compile) {
  const map = compile(expression)
  return (doc, ctx) => {
    const value = map(ctx.root, ctx)
    if (isNullish(value)) {
      return null
    } else if (value === Number.POSITIVE_INFINITY) {
      return Number.POSITIVE_INFINITY
    } else if (value === Number.NEGATIVE_INFINITY) {
      return 0
    } else if (isNumber(value)) {
      return Math.exp(value)
    } else {
      return NaN
    }
  }
}
