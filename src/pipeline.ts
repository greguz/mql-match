import { wrapBSON } from './lib/bson.js'
import type {
  PipelineOperator,
  PipelineOperatorConstructor,
} from './lib/pipeline.js'
import { isPlainObject } from './lib/util.js'
import { $count } from './pipeline/count.js'
import { $limit } from './pipeline/limit.js'
import { $match } from './pipeline/match.js'
import { $project } from './pipeline/project.js'
import { $set } from './pipeline/set.js'
import { $skip } from './pipeline/skip.js'
import { $unset } from './pipeline/unset.js'
import { $unwind } from './pipeline/unwind.js'

const OPERATORS: Record<string, PipelineOperatorConstructor | undefined> = {
  $addFields: $set,
  $count,
  $limit,
  $match,
  $project,
  $set,
  $skip,
  $unset,
  $unwind,
}

export function parsePipeline(stages: unknown[]): PipelineOperator {
  if (!stages.length) {
    throw new TypeError('Pipeline aggregation needs at lest one stage')
  }
  return stages
    .map(parseStage)
    .reduce((left, right) => docs => right(left(docs)))
}

function parseStage(obj: unknown): PipelineOperator {
  if (!isPlainObject(obj)) {
    throw new TypeError('Pipeline aggregation stage must be an object')
  }

  const keys = Object.keys(obj)
  if (keys.length !== 1) {
    throw new TypeError(
      'Pipeline aggregation stage must be an object with one key',
    )
  }

  const $operator = OPERATORS[keys[0]]
  if (!$operator) {
    throw new TypeError(`Unsupported pipeline operator: ${keys[0]}`)
  }

  return $operator(wrapBSON(obj[keys[0]]))
}
