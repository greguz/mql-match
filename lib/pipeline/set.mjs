import { compileAggregationExpression } from '../aggregationExpression.mjs'
import { isPlainObject } from '../util.mjs'

export function $set (expression) {
  if (!isPlainObject(expression)) {
    throw new TypeError('Stage $set expects an object')
  }
  const fn = compileAggregationExpression({
    ...cast(expression),
    __hack__: 0 // Hack to pick all properties
  })
  return async function * setStage (iterable) {
    for await (const document of iterable) {
      yield fn(document)
    }
  }
}

function cast (value) {
  if (value === undefined) {
    return null
  } else if (value === 0 || value === 1 || typeof value === 'boolean') {
    return { $literal: value }
  } else if (Array.isArray(value)) {
    return value.map(cast)
  } else if (isPlainObject(value)) {
    return Object.keys(value).reduce(
      (acc, key) => {
        acc[key] = cast(value[key])
        return acc
      },
      {}
    )
  } else {
    return value
  }
}
