export function $count (key) {
  if (typeof key !== 'string') {
    throw new TypeError('Stage $count expects a string as input')
  }
  return async function * countStage (iterable) {
    let count = 0
    // eslint-disable-next-line
    for await (const _ of iterable) {
      count++
    }
    yield { [key]: count }
  }
}
