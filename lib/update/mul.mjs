import { compileReader, compileWriter } from '../path.mjs'
import { isNumber } from '../util.mjs'

export function $mul (key, value) {
  if (!isNumber(value)) {
    throw new TypeError('Operator $mul expects a finite number')
  }
  const readValue = compileReader(key)
  const writeValue = compileWriter(key)
  return document => {
    let current = readValue(document)
    if (current === undefined) {
      current = 0
    }
    if (!isNumber(current)) {
      throw new Error(`Cannot apply $mul operator to ${document._id} document`)
    }
    writeValue(document, current * value)
  }
}
