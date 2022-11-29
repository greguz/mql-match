import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { compileReader, compileWriter } from '../path.mjs'
import { isFinite, isUndefined } from '../util.mjs'

export function $inc (key, value) {
  value = n(value)
  if (!isFinite(value)) {
    throw new TypeError('Operator $inc expectes a finite number')
  }

  const read = compileReader(key)
  const write = compileWriter(key)
  return document => {
    let current = n(read(document))
    if (isUndefined(current)) {
      current = 0
    }
    if (!isNumber(current)) {
      throw new Error('Cannot apply $inc operator')
    }
    write(document, Decimal.add(current, value).toNumber())
  }
}
