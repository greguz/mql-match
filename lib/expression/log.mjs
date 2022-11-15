import Big from 'big.js'

import { declareOperatorError } from '../error.mjs'
import { isNumber } from '../util.mjs'

const OperatorError = declareOperatorError('$log')

export function $log (arg, compile) {
  if (!Array.isArray(arg) || arg.length !== 2) {
    throw new OperatorError(
      'Operator $log expects an array of two expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const [value, base] = fns.map(fn => fn(doc, ctx))
    if (!isNumber(value) || value < 0) {
      throw new OperatorError(
        'Operator $log expects a non-negative as argument',
        {
          argument: arg,
          document: doc,
          value
        }
      )
    }
    if (!isNumber(base) || base <= 1) {
      throw new OperatorError(
        'Operator $log expects a positive base number greater than 1',
        {
          argument: arg,
          document: doc,
          value
        }
      )
    }

    // TODO: this should be more precise?
    // TODO: BigInt support
    if (base === Math.E) {
      return Math.log(value)
    } else if (base === 2) {
      return Math.log2(value)
    } else if (base === 10) {
      return Math.log10(value)
    } else {
      return Big(Math.log(value)).div(Math.log(base)).toNumber()
    }
  }
}

export function $ln (expression, compile) {
  return $log([expression, Math.E], compile)
}

export function $log10 (expression, compile) {
  return $log([expression, 10], compile)
}
