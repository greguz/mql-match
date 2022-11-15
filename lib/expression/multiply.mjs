import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import { isArray, isNumber } from '../util.mjs'

const OperatorError = declareOperatorError('$multiply')

export function $multiply (arg, compile) {
  if (!isArray(arg)) {
    throw new OperatorError(
      'Operator $multiply expects an array of expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const values = fns.map(fn => fn(doc, ctx))

    let result = Big(1)
    for (const value of values) {
      if (isNumber(value)) {
        result = result.times(value)
      } else {
        throw new OperatorError(
          'Operator $multiply expects a numeric value as input',
          {
            argument: arg,
            document: doc,
            value
          }
        )
      }
    }

    return result.toNumber()
  }
}
