import { isNullish, isNumber } from '../util.mjs'

export function $exp (arg, compile) {
  const map = compile(arg)

  return (doc, ctx) => {
    let value = map(doc, ctx)

    if (isNullish(value)) {
      return null
    } else if (value === Number.POSITIVE_INFINITY) {
      return Number.POSITIVE_INFINITY
    } else if (value === Number.NEGATIVE_INFINITY) {
      return 0
    } else if (isNumber(value)) {
      if (
        typeof value === 'bigint' &&
        value <= Number.MAX_SAFE_INTEGER &&
        value >= Number.MIN_SAFE_INTEGER
      ) {
        value = Number(value)
      }
      if (typeof value === 'bigint') {
        throw new Error('Operator $exp does not support BigInt values')
      }
      return Math.exp(value)
    } else {
      return NaN
    }
  }
}
