import { compileAggregationExpression } from '../aggregationExpression.mjs'

export function $expr (spec) {
  const map = compileAggregationExpression(spec)
  return doc => !!map(doc)
}
