import { compileFilterQuery } from '../filterQuery.mjs'
import { parsePath, readValue, writeValue } from '../path.mjs'
import { isArray } from '../util.mjs'

export function $pull (key, query) {
  const path = parsePath(key)
  const match = compileFilterQuery(query)
  return document => {
    const items = readValue(document, path)
    if (isArray(items)) {
      writeValue(document, path, items.filter(item => !match(item)))
    }
  }
}
