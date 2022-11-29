import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isDate, isNullish } from '../util.mjs'

export function $subtract (args, compile) {
  if (args.length !== 2) {
    throw new Error('Expression $subtract takes exactly 2 arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [leftArg, rightArg] = fns.map(fn => fn(doc, ctx))

    if (isNullish(leftArg) || isNullish(rightArg)) {
      return null
    }

    if (!isNumberLike(leftArg) || !isNumberLike(rightArg)) {
      throw new TypeError('Expression $subtract only supports numeric or date types')
    }

    const leftVal = cast(leftArg)
    const rightVal = cast(rightArg)

    const result = Decimal.sub(leftVal, rightVal).toNumber()

    return isDate(leftArg) && !isDate(rightArg)
      ? new Date(result)
      : result
  }
}

function isNumberLike (value) {
  return isDate(value) || isNumber(value)
}

function cast (value) {
  return isDate(value) ? value.getTime() : n(value)
}
