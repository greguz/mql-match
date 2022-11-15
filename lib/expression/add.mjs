import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import { isArray, isDate, isNumber } from '../util.mjs'

const OperatorError = declareOperatorError('$add')

export function $add (arg, compile) {
  if (!isArray(arg)) {
    throw new OperatorError(
      'Operator $add expects an array',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const values = fns.map(fn => fn(doc, ctx))

    let result = Big(0)
    for (const value of values) {
      if (isDate(value)) {
        result = result.plus(value.getTime())
      } else if (isNumber(value)) {
        result = result.plus(value)
      } else {
        throw new OperatorError(
          'Operator $add only supports numeric or date types',
          {
            argument: arg,
            document: doc,
            value
          }
        )
      }
    }

    return values.length >= 1 && isDate(values[0])
      ? new Date(result.toNumber())
      : result.toNumber()
  }
}
