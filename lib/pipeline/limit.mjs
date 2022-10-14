export function $limit (limit) {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new TypeError('Stage $limit expects limit a positive integer')
  }
  return async function * limitStage (iterable) {
    let count = 0
    for await (const document of iterable) {
      count++
      yield document
      if (count >= limit) {
        return
      }
    }
  }
}
