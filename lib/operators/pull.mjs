import { compileFilterQuery } from '../filterQuery.mjs'
import { compileReader, compileWriter } from '../path.mjs'
import { isArray } from '../util.mjs'

export function $pull (key, query) {
  const readValue = compileReader(key)
  const writeValue = compileWriter(key)
  const match = compileFilterQuery(query)
  return document => {
    const items = readValue(document)
    if (isArray(items)) {
      writeValue(document, items.filter(item => !match(item)))
    }
  }
}
