import { $and } from './expression/boolean.js'
import { parseExpression, resolveExpression } from './expression.js'
import { wrapBSON } from './lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  type MatchPathNode,
  NodeKind,
  nBoolean,
  nNullish,
} from './lib/node.js'
import { type Operator, parseOperatorArguments } from './lib/operator.js'
import { type Path, parsePath } from './lib/path.js'
import { expected, isPlainObject } from './lib/util.js'
import { $size } from './match/array.js'
import { $eq, $gt, $gte, $in, $lt, $lte } from './match/comparison.js'
import { $mod, $regex } from './match/miscellaneous.js'
import { $exists, $type } from './match/type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/mql/query-predicates/
 */
const OPERATORS: Record<string, Operator | undefined> = {
  $and,
  $eq,
  $exists,
  $gt,
  $gte,
  $in,
  $lt,
  $lte,
  $mod,
  $regex,
  $size,
  $type,
}

export function compileMatch(query: unknown = {}) {
  const nodes = parseMatch(isPlainObject(query) ? query : { $eq: query })
  return (value?: unknown): boolean => {
    return resolveMatch(nodes, wrapBSON(value)).value
  }
}

/**
 * Parse a top-level query.
 */
export function parseMatch(query: Record<string, unknown>): MatchPathNode[] {
  const nodes: MatchPathNode[] = []

  const keys = Object.keys(query)
  if (
    keys.some(
      k =>
        k[0] === '$' &&
        k !== '$and' &&
        k !== '$expr' &&
        k !== '$nor' &&
        k !== '$or',
    )
  ) {
    nodes.push(...compilePathPredicate(keys, query, []))
  } else {
    for (const key of keys) {
      nodes.push(...compilePredicateKey(key, query[key]))
    }
  }

  return nodes
}

function* compilePredicateKey(
  key: string,
  value: unknown,
): Generator<MatchPathNode> {
  // TODO: $and, $or, $nor (top-level or directly inside $elemMatch)
  if (key === '$expr') {
    // TODO: $expr is only top-level
    yield {
      kind: NodeKind.MATCH_PATH,
      path: [],
      operator: key,
      args: [parseExpression({ $toBool: value })],
      negate: false,
    }
    return
  }

  const path = parsePath(key)

  if (isPlainObject(value)) {
    const keys = Object.keys(value)
    if (keys.some(k => k[0] === '$')) {
      yield* compilePathPredicate(keys, value, path)
      return
    }
  }

  yield* compileOperator(path, '$eq', value)
}

function* compilePathPredicate(
  keys: string[],
  query: Record<string, unknown>,
  path: Path,
): Generator<MatchPathNode> {
  // $regex and $options are special babys...
  if (query.$options && !query.$regex) {
    throw new TypeError('$options needs a $regex')
  }

  for (const k of keys) {
    if (k !== '$options') {
      // $regex and $options are special babys...
      yield* compileOperator(path, k, k === '$regex' ? query : query[k])
    }
  }
}

function* compileOperator(
  path: Path,
  key: string,
  value: unknown,
): Generator<MatchPathNode> {
  if (key === '$elemMatch') {
    if (!isPlainObject(value)) {
      throw new TypeError('$elemMatch needs an Object')
    }
    yield {
      kind: NodeKind.MATCH_PATH,
      path,
      operator: key,
      args: parseMatch(value),
      negate: false,
    }
    return
  }

  if (key === '$not') {
    if (!isPlainObject(value)) {
      throw new TypeError('$not needs an Object')
    }
    for (const node of compilePathPredicate(Object.keys(value), value, path)) {
      node.negate = !node.negate
      yield node
    }
    return
  }

  let negate = false
  switch (key) {
    case '$ne':
      key = '$eq'
      negate = true
      break
    case '$nin':
      key = '$in'
      negate = true
      break
  }

  const fn = OPERATORS[key]
  if (!fn) {
    throw new Error(`Unsupported match operator: ${key}`)
  }

  yield {
    kind: NodeKind.MATCH_PATH,
    path,
    operator: key,
    args: parseOperatorArguments(fn, [wrapBSON(value)]),
    negate,
  }
}

/**
 * Resolve parsed node into raw value.
 */
export function resolveMatch(
  query: MatchPathNode[],
  document: BSONNode,
): BooleanNode {
  for (const node of query) {
    const values = getPathValues(node.path, document)
    if (!values.length) {
      values.push(nNullish())
    }

    // node result
    let result = false

    // if NOT negated: first matching value skips to next rule
    for (let li = 0; li < values.length && !result; li++) {
      const left = values[li]

      switch (node.operator) {
        case '$elemMatch': {
          if (left.kind === NodeKind.ARRAY) {
            for (let ai = 0; ai < left.value.length && !result; ai++) {
              result = resolveMatch(
                node.args as MatchPathNode[], // TODO: hack
                left.value[ai],
              ).value
            }
          }
          break
        }

        case '$expr': {
          // $toBool was added during parsing
          result = !!resolveExpression(node.args[0], document).value
          break
        }

        default: {
          const fn = expected(OPERATORS[node.operator])
          result = !!fn(left, ...(node.args as BSONNode[])).value // TODO: hack
          break
        }
      }

      // if negated: first non-matching value returns false instantly
      if (node.negate && result) {
        return nBoolean(false)
      }
    }

    if (node.negate) {
      result = !result
    }
    if (!result) {
      return nBoolean(false)
    }
  }

  return nBoolean(true)
}

export function getPathValues(
  path: Path,
  node: BSONNode,
  results: BSONNode[] = [],
): BSONNode[] {
  if (!path.length) {
    results.push(node)
  } else if (node.kind === NodeKind.ARRAY) {
    for (let i = 0; i < node.value.length; i++) {
      getPathValues(path, node.value[i], results)
    }
  } else if (node.kind === NodeKind.OBJECT) {
    const child = node.value[path[0]]
    if (child) {
      getPathValues(path.slice(1), child, results)
    }
  }

  return results
}
