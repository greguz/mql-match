import { unwrapBSON, wrapBSON } from './lib/bson.js'
import type { BSONNode } from './lib/node.js'
import { type PipelineOperator, parsePipelineArgs } from './lib/operator.js'
import { isPlainObject } from './lib/util.js'
import { $count } from './pipeline/count.js'
import { $limit } from './pipeline/limit.js'
import { $match } from './pipeline/match.js'
import { $project } from './pipeline/project.js'
import { $skip } from './pipeline/skip.js'

const OPERATORS: Record<string, PipelineOperator<any[]> | undefined> = {
  $count,
  $limit,
  $match,
  $project,
  $skip,
}

type PipelineStage = (docs: Iterable<BSONNode>) => Iterable<BSONNode>

export function compilePipeline(stages: unknown[]) {
  const aggregate = parsePipeline(stages)
  return (values: Iterable<unknown>): unknown[] => {
    return unwrapIterable(aggregate(wrapIterable(values)))
  }
}

function* wrapIterable(values: Iterable<unknown>): Iterable<BSONNode> {
  for (const value of values) {
    yield wrapBSON(value)
  }
}

function unwrapIterable(docs: Iterable<BSONNode>): unknown[] {
  const results: unknown[] = []
  for (const doc of docs) {
    results.push(unwrapBSON(doc))
  }
  return results
}

function parsePipeline(stages: unknown[]): PipelineStage {
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
