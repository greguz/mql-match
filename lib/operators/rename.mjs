import { deleteValue, parsePath, readValue, writeValue } from '../path.mjs'

export function $rename (oldKey, newKey) {
  if (typeof newKey !== 'string') {
    throw new TypeError('Operator $rename expects a string value as input')
  }
  const oldPath = parsePath(oldKey)
  const newPath = parsePath(newKey)
  return document => {
    const value = readValue(document, oldPath)
    if (value !== undefined) {
      writeValue(document, newPath, value)
      deleteValue(document, oldPath)
    }
  }
}
