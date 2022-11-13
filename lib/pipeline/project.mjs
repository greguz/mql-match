import { compileAggregationExpression } from '../aggregationExpression.mjs'
import { isPlainObject } from '../util.mjs'

export function $project (expression) {
  if (!isPlainObject(expression)) {
    throw new TypeError('Stage $project expects an object')
  }
  const map = compileAggregationExpression(expression)
  return async function * projectStage (iterable) {
    for await (const document of iterable) {
      yield map(document)
    }
  }
}
