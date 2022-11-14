import { isInfinity, isNullish, isNumber } from '../util.mjs'

export function $floor (expression, compile) {
  const map = compile(expression)
  return (doc, ctx) => {
    const value = map(ctx.root, ctx)
    if (isNullish(value)) {
      return null
    } else if (isInfinity(value)) {
      return value
    } else if (isNumber(value)) {
      return Math.floor(value)
    } else {
      return NaN
    }
  }
}
