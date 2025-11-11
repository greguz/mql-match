import { compileExpression } from './expression.js'
import { unwrapBSON, wrapBSON } from './lib/bson.js'
import type { BSONNode } from './lib/node.js'
import { compileMatch } from './match.js'
import { compilePipeline } from './pipeline.js'
import { compileUpdate } from './update.js'

/**
 * @deprecated
 */
export function compileAggregationExpression(value: unknown) {
  const expression = compileExpression(wrapBSON(value))

  return <T = any>(doc?: unknown): T => {
    return unwrapBSON(expression(wrapBSON(doc))) as T
  }
}

/**
 * @deprecated
 */
export function compileAggregationPipeline(
  stages: Array<Record<string, unknown>>,
) {
  const aggregate = compilePipeline(wrapBSON(stages))

  return <T = any>(docs: Iterable<unknown>): Iterable<T> => {
    return unwrapIterable(aggregate(wrapIterable(docs))) as T[]
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

/**
 * @deprecated
 */
export function compileFilterQuery(query: unknown) {
  const match = compileMatch(wrapBSON(query))

  return (doc: unknown): boolean => {
    return match(wrapBSON(doc)).value
  }
}

/**
 * @deprecated
 */
export function compileUpdateQuery(query: unknown) {
  const update = compileUpdate(wrapBSON(query))

  return <T = any>(doc: unknown, isInsert?: unknown): T => {
    // Old property to handle...
    if (isInsert === true) {
      throw new Error('$setOnInsert is not supported')
    }
    update(wrapBSON(doc))
    return doc as T
  }
}
