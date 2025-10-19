import { wrapBSON } from './lib/bson.js'
import type { BSONNode } from './lib/node.js'
import { type PipelineOperator, parsePipelineArgs } from './lib/operator.js'
import { isPlainObject } from './lib/util.js'
import { $count } from './pipeline/count.js'
import { $limit } from './pipeline/limit.js'
import { $match } from './pipeline/match.js'
import { $project } from './pipeline/project.js'
import { $set } from './pipeline/set.js'
import { $skip } from './pipeline/skip.js'
import { $unset } from './pipeline/unset.js'

const OPERATORS: Record<string, PipelineOperator<any[]> | undefined> = {
  $addFields: $set,
  $count,
  $limit,
  $match,
  $project,
  $set,
  $skip,
  $unset,
}

export type PipelineStage = (docs: Iterable<BSONNode>) => Iterable<BSONNode>

export function parsePipeline(stages: unknown[]): PipelineStage {
  if (!stages.length) {
    throw new TypeError('Pipeline aggregation needs at lest one stage')
  }
  return stages
    .map(parseStage)
    .reduce((left, right) => docs => right(left(docs)))
}

function parseStage(obj: unknown): PipelineStage {
  if (!isPlainObject(obj)) {
    throw new TypeError('Pipeline aggregation stage must be an object')
  }

  const keys = Object.keys(obj)
  if (keys.length !== 1) {
    throw new TypeError(
      'Pipeline aggregation stage must be an object with one key',
    )
  }

  const operator = OPERATORS[keys[0]]
  if (!operator) {
    throw new TypeError(`Unsupported pipeline operator: ${keys[0]}`)
  }

  const args = parsePipelineArgs(operator, wrapBSON(obj[keys[0]]))

  return docs => operator(docs, ...args)
}
