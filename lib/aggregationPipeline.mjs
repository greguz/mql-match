import { isArray, isExpressionObject } from './util.mjs'

import { $count } from './pipeline/count.mjs'
import { $limit } from './pipeline/limit.mjs'
import { $match } from './pipeline/match.mjs'
import { $skip } from './pipeline/skip.mjs'

export function compileAggregationPipeline (stages) {
  if (!isArray(stages)) {
    throw new TypeError('An aggregation pipeline must be an array')
  }
  const fns = stages.map(compileStage)
  return function aggregate (iterable) {
    return fns.reduce((acc, fn) => fn(acc), iterable)
  }
}

const stages = {
  $count,
  $limit,
  $match,
  $skip
}

function compileStage (stage) {
  if (!isExpressionObject(stage)) {
    throw new TypeError('Unexpected aggregation stage')
  }

  const key = Object.keys(stage)[0]
  const fn = stages[key]
  if (!fn) {
    throw new Error(`Unsupported aggregation stage: ${key}`)
  }

  return fn(stage[key])
}
