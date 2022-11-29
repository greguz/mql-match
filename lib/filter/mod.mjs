import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isArray } from '../util.mjs'

export function $mod (spec) {
  if (!isArray(spec)) {
    throw new TypeError('Operator $mod expects an array')
  }
  if (spec.length !== 2) {
    throw new Error('Operator $mod expects an array with two values')
  }
  if (!isNumber(spec[0]) || !isNumber(spec[1])) {
    throw new TypeError('Operator $mod only supports numeric types')
  }

  const divider = n(spec[0])
  const result = n(spec[1])

  return value => isNumber(value) &&
    Decimal.mod(n(value), divider).equals(result)
}
