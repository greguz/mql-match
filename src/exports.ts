import { parseExpression, resolveExpression } from './expression.js'
import { unwrapBSON, wrapBSON } from './lib/bson.js'
import type { BSONNode } from './lib/node.js'
import { parseMatch, resolveMatch } from './match.js'
import { parsePipeline } from './pipeline.js'
import { parseUpdate, resolveUpdate } from './update.js'

export function compileAggregationExpression(expr: unknown) {
  const node = parseExpression(wrapBSON(expr))
  return <T = any>(doc?: unknown): T => {
    return unwrapBSON(resolveExpression(node, wrapBSON(doc))) as T
  }
}

export function compileFilterQuery(query: Record<string, unknown> = {}) {
  const node = parseMatch(wrapBSON(query))

  return (value?: unknown): boolean => {
    return resolveMatch(node, wrapBSON(value)).value
  }
}

export function compileAggregationPipeline(
  stages: Array<Record<string, unknown>>,
) {
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

export function compileUpdateQuery(query: Record<string, unknown>) {
  const nodes = Array.from(parseUpdate(query))

  return <T = any>(doc: unknown): T => {
    resolveUpdate(nodes, wrapBSON(doc))
    return doc as T
  }
}
