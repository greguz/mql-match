export function $skip (skip) {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new TypeError('Stage $skip expects a positive integer or zero')
  }
  return async function * skipStage (iterable) {
    for await (const document of iterable) {
      if (skip > 0) {
        skip--
      } else {
        yield document
      }
    }
  }
}
