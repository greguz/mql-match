import { parsePath, writeValue } from '../path.mjs'

export function $set (key, value) {
  const path = parsePath(key)
  return document => {
    writeValue(document, path, value)
  }
}
