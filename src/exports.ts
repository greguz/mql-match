import { evalExpression, parseExpression } from './expression.js'
import { unwrapBSON, wrapBSON } from './lib/bson.js'
import type { BSONNode } from './lib/node.js'
import type { UpdateContext } from './lib/update.js'
import { evalMatch, parseMatch } from './match.js'
import { parsePipeline } from './pipeline.js'
import { evalUpdate, parseUpdate } from './update.js'

export function compileExpression(expr: unknown) {
  const node = parseExpression(wrapBSON(expr))
  return <T = any>(doc?: unknown): T => {
    return unwrapBSON(evalExpression(node, wrapBSON(doc))) as T
  }
}

export function compileMatch(query: Record<string, unknown> = {}) {
  const node = parseMatch(wrapBSON(query))

  return (value?: unknown): boolean => {
    return evalMatch(node, wrapBSON(value)).value
  }
}

export function compilePipeline(stages: Array<Record<string, unknown>>) {
  const aggregate = parsePipeline(stages)

  return <T = any>(values: Iterable<unknown>): T[] => {
    return unwrapIterable(aggregate(wrapIterable(values))) as T[]
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

export function compileUpdate(query: Record<string, unknown>) {
  const nodes = Array.from(parseUpdate(query))

  // TODO: argument
  const ctx: UpdateContext = {
    positions: new Map(),
  }

  return <T = any>(doc: unknown): T => {
    evalUpdate(ctx, nodes, wrapBSON(doc))
    return doc as T
  }
}

export {
  /**
   * @deprecated use `compileUpdate` instead
   */
  compileUpdate as compileUpdateQuery,
  /**
   * @deprecated use `compilePipeline` instead
   */
  compilePipeline as compileAggregationPipeline,
  /**
   * @deprecated use `compileMatch` instead
   */
  compileMatch as compileFilterQuery,
  /**
   * @deprecated use `compileExpression` instead
   */
  compileExpression as compileAggregationExpression,
}
