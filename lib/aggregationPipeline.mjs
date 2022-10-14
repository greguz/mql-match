import { isArray, isPlainObject } from './util.mjs'

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
  if (!isPlainObject(stage)) {
    throw new TypeError('Aggregation stage must be an object')
  }

  const keys = Object.keys(stage)
  if (keys.length !== 1) {
    throw new Error('An aggregation stage object must have only one key')
  }

  const fn = stages[keys[0]]
  if (!fn) {
    throw new Error(`Unsupported aggregation stage: ${keys[0]}`)
  }

  return fn(stage[keys[0]])
}
