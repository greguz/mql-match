import { compileReader } from '../path.mjs'
import { isArray } from '../util.mjs'

export function $pop (key, value) {
  if (value !== 1 && value !== -1) {
    throw new TypeError('Operator $pop accepts only 1 or -1 as input values')
  }
  const readValue = compileReader(key)
  return document => {
    const arr = readValue(document)
    if (!isArray(arr)) {
      throw new TypeError(`Operator $pop cannot update the ${key} field`)
    } else if (value === -1) {
      arr.shift()
    } else {
      arr.pop()
    }
  }
}
