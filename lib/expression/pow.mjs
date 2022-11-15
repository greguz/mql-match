import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import { isNumber } from '../util.mjs'

const OperatorError = declareOperatorError('$pow')

export function $pow (arg, compile) {
  if (!Array.isArray(arg) || arg.length !== 2) {
    throw new OperatorError(
      'Operator $pow expects an array of two expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const [value, exponent] = fns.map(fn => fn(doc, ctx))
    if (!isNumber(value)) {
      throw new OperatorError(
        'Operator $pow expects a numeric value',
        {
          argument: arg,
          document: doc,
          value
        }
      )
    }
    if (!isNumber(exponent)) {
      throw new OperatorError(
        'Operator $pow expects a numeric exponent',
        {
          argument: arg,
          document: doc,
          value: exponent
        }
      )
    }

    return Big(value).pow(exponent).toNumber()
  }
}
