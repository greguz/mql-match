import { type BSONNode, NodeKind } from './lib/node.js'
import type {
  PipelineOperator,
  PipelineOperatorConstructor,
} from './lib/pipeline.js'
import { expected } from './lib/util.js'
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

/**
 * Applies pipeline's stages to `docs` iterable.
 * Returns a new iterable with new documents.
 */
export type Pipeline = (docs: Iterable<BSONNode>) => Iterable<BSONNode>

export function compilePipeline(node: BSONNode): Pipeline {
  if (node.kind !== NodeKind.ARRAY) {
    throw new TypeError('Pipeline aggregation needs an array of stages')
  }
  if (!node.value.length) {
    throw new TypeError('Pipeline aggregation needs at lest one stage')
  }
  return node.value
    .map(compileStage)
    .reduce((left, right) => docs => right(left(docs)))
}

function compileStage(node: BSONNode): PipelineOperator {
  if (node.kind !== NodeKind.OBJECT) {
    throw new TypeError('Pipeline aggregation stage must be an object')
  }

  if (node.keys.length !== 1) {
    throw new TypeError(
      'Pipeline aggregation stage must be an object with one key',
    )
  }

  const key = node.keys[0]
  const value = expected(node.value[key])

  const $operator = OPERATORS[key]
  if (!$operator) {
    throw new TypeError(`Unsupported pipeline operator: ${key}`)
  }

  return $operator(value)
}
