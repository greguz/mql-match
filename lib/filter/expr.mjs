import { compileAggregationExpression } from '../aggregationExpression.mjs'
import { isTruthy } from '../bson.mjs'

export function $expr (spec) {
  const map = compileAggregationExpression(spec)
  return doc => isTruthy(map(doc))
}
