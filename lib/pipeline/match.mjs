import { compileFilterQuery } from '../filterQuery.mjs'

export function $match (query) {
  const fn = compileFilterQuery(query)
  return async function * matchStage (iterable) {
    for await (const document of iterable) {
      if (fn(document)) {
        yield document
      }
    }
  }
}
