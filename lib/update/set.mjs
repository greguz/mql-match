import { compileWriter } from '../path.mjs'

export function $set (key, value) {
  const writeValue = compileWriter(key)
  return document => {
    writeValue(document, value)
  }
}
