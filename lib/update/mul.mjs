import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { compileReader, compileWriter } from '../path.mjs'
import { isUndefined } from '../util.mjs'

export function $mul (key, value) {
  if (!isNumber(value)) {
    throw new TypeError('Operator $mul expects a finite number')
  }

  const read = compileReader(key)
  const write = compileWriter(key)
  return document => {
    let current = read(document)
    if (isUndefined(current)) {
      current = 0
    }
    if (!isNumber(current)) {
      throw new Error(`Cannot apply $mul operator to ${document._id} document`)
    }
    write(
      document,
      Decimal.mul(n(current), n(value)).toNumber()
    )
  }
}
