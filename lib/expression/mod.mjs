import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import { isNumber } from '../util.mjs'

const OperatorError = declareOperatorError('$mod')

export function $mod (arg, compile) {
  if (!Array.isArray(arg) || arg.length !== 2) {
    throw new OperatorError(
      'Operator $mod expects an array of two expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const [dividend, divisor] = fns.map(fn => fn(doc, ctx))
    if (!isNumber(dividend)) {
      throw new OperatorError(
        'Operator $mod expects a numeric dividend',
        {
          argument: arg,
          document: doc,
          value: dividend
        }
      )
    }
    if (!isNumber(divisor)) {
      throw new OperatorError(
        'Operator $mod expects a numeric divisor',
        {
          argument: arg,
          document: doc,
          value: divisor
        }
      )
    }

    return Big(dividend).mod(divisor).toNumber()
  }
}
