import { compileWriter } from '../path.mjs'

export function $setOnInsert (key, value) {
  const writeValue = compileWriter(key)
  return (document, ctx) => {
    if (ctx.insert) {
      writeValue(document, value)
    }
  }
}
