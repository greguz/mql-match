import { parsePath, writeValue } from '../path.mjs'

export function $setOnInsert (key, value) {
  const path = parsePath(key)
  return (document, ctx) => {
    if (ctx.insert) {
      writeValue(document, path, value)
    }
  }
}
