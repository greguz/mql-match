import { parsePath, readValue, writeValue } from '../path.mjs'
import { isNumber } from '../util.mjs'

export function $inc (key, value) {
  if (!isNumber(value)) {
    throw new TypeError()
  }
  const path = parsePath(key)
  return document => {
    const current = readValue(document, path, 0)
    if (!isNumber(current)) {
      throw new Error()
    }
    writeValue(document, path, current + value)
  }
}
