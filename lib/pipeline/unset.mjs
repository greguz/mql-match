import { compileAggregationExpression } from '../aggregationExpression.mjs'
import { isPlainObject } from '../util.mjs'

export function $unset (expression) {
  const fn = compileProjectionAlias(expression)
  return async function * unsetStage (iterable) {
    for await (const document of iterable) {
      yield fn(document)
    }
  }
}

function compileProjectionAlias (expression) {
  if (typeof expression === 'string') {
    return compileAggregationExpression({ [expression]: 0 })
  } else if (Array.isArray(expression)) {
    return compileUnserSeries(expression)
  } else if (isPlainObject(expression)) {
    return compileAggregationExpression(expression)
  } else {
    throw new TypeError(`Unexpected $unset value: ${expression}`)
  }
}

function compileUnserSeries (items) {
  return compileAggregationExpression(
    items.reduce(
      (acc, item) => {
        if (typeof item !== 'string') {
          throw new TypeError('Expected string value')
        }
        acc[item] = 0
        return acc
      },
      {}
    )
  )
}
