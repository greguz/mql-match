import { compileReader, compileWriter } from '../path.mjs'
import { isNumber } from '../util.mjs'

export function $inc (key, value) {
  if (!isNumber(value)) {
    throw new TypeError('Operator $inc expectes a finite number')
  }
  const readValue = compileReader(key)
  const writeValue = compileWriter(key)
  return document => {
    let current = readValue(document)
    if (current === undefined) {
      current = 0
    }
    if (!isNumber(current)) {
      throw new Error(`Cannot apply $inc operator to ${document._id} document`)
    }
    writeValue(document, current + value)
  }
}
