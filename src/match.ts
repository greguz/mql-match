import { parseExpression, resolveExpression } from './expression.js'
import { wrapBSON } from './lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  type MatchArrayNode,
  type MatchNode,
  type MatchPathNode,
  type MatchSequenceNode,
  NodeKind,
  nBoolean,
  nNullish,
  type ObjectNode,
} from './lib/node.js'
import { parseQueryArgs, type QueryOperator } from './lib/operator.js'
import { type Path, parsePath } from './lib/path.js'
import { expected } from './lib/util.js'
import { $all, $size } from './match/array.js'
import { $eq, $gt, $gte, $in, $lt, $lte } from './match/comparison.js'
import { $mod, $regex } from './match/miscellaneous.js'
import { $exists, $type } from './match/type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/mql/query-predicates/
 */
const OPERATORS: Record<string, QueryOperator<any[]> | undefined> = {
  $all,
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
  const node = parseMatch(wrapBSON(query))
  return (value?: unknown): boolean => {
    return resolveMatch(node, wrapBSON(value)).value
  }
}

/**
 * Parse a top-level query.
 */
export function parseMatch(query: BSONNode): MatchNode | MatchSequenceNode {
  const $and: MatchSequenceNode = {
    kind: NodeKind.MATCH_SEQUENCE,
    operator: '$and',
    nodes: [],
  }
  if (query.kind !== NodeKind.OBJECT) {
    $and.nodes.push(...compileOperator([], '$eq', query))
    return $and.nodes.length === 1 ? $and.nodes[0] : $and
  }

  for (const key of query.keys) {
    const value = expected(query.value[key])

    // Handle direct path values
    if (key[0] !== '$') {
      $and.nodes.push(...compilePredicateKey(key, value))
      continue
    }

    // Handle operators
    switch (key) {
      case '$expr':
        $and.nodes.push({
          kind: NodeKind.MATCH_EXPRESSION,
          expression: parseExpression({
            kind: NodeKind.OBJECT,
            keys: ['$toBool'],
            raw: undefined,
            value: { $toBool: value },
          }),
        })
        break

      case '$and': {
        if (value.kind !== NodeKind.ARRAY || !value.value.length) {
          throw new TypeError(`Operator ${key} expects a non-empty array`)
        }
        for (const item of value.value) {
          const child = parseMatch(item)

          if (
            child.kind === NodeKind.MATCH_SEQUENCE &&
            child.operator === '$and'
          ) {
            $and.nodes.push(...child.nodes)
          } else {
            $and.nodes.push(child)
          }
        }
        break
      }

      case '$nor':
      case '$or': {
        if (value.kind !== NodeKind.ARRAY || !value.value.length) {
          throw new TypeError(`Operator ${key} expects a non-empty array`)
        }
        $and.nodes.push({
          kind: NodeKind.MATCH_SEQUENCE,
          operator: key,
          nodes: value.value.map(parseMatch),
        })
        break
      }

      default:
        $and.nodes.push(...compileOperator([], key, value))
        break
    }
  }

  return $and.nodes.length === 1 ? $and.nodes[0] : $and
}

function* compilePredicateKey(
  key: string,
  node: BSONNode,
): Generator<MatchNode> {
  const path = parsePath(key)

  if (node.kind === NodeKind.OBJECT) {
    if (node.keys.some(k => k[0] === '$')) {
      yield* compilePredicateObject(node, path)
      return
    }
  }

  yield* compileOperator(path, '$eq', node)
}

function* compilePredicateObject(
  node: ObjectNode,
  path: Path,
): Generator<MatchArrayNode | MatchPathNode> {
  // $regex and $options are special babys...
  if (node.value.$options && !node.value.$regex) {
    throw new TypeError('$options needs a $regex')
  }

  for (const k of node.keys) {
    if (k !== '$options') {
      // $regex and $options are special babys...
      yield* compileOperator(
        path,
        k,
        k === '$regex' ? node : expected(node.value[k]),
      )
    }
  }
}

function* compileOperator(
  path: Path,
  key: string,
  value: BSONNode,
): Generator<MatchArrayNode | MatchPathNode> {
  if (key === '$comment') {
    // Stub
    return
  }

  if (key === '$elemMatch') {
    if (value.kind !== NodeKind.OBJECT) {
      throw new TypeError('$elemMatch needs an Object')
    }
    yield {
      kind: NodeKind.MATCH_ARRAY,
      path,
      node: parseMatch(value),
      negate: false,
    }
    return
  }

  if (key === '$not') {
    if (value.kind !== NodeKind.OBJECT) {
      throw new TypeError('$not needs an Object')
    }
    for (const n of compilePredicateObject(value, path)) {
      n.negate = !n.negate
      yield n
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
    args: parseQueryArgs(fn, value),
    negate,
  }
}

export function resolveMatch(node: MatchNode, doc: BSONNode): BooleanNode {
  if (node.kind === NodeKind.MATCH_EXPRESSION) {
    // $toBool was added during parsing
    return nBoolean(resolveExpression(node.expression, doc, doc).value === true)
  }

  if (node.kind !== NodeKind.MATCH_SEQUENCE) {
    return resolveMatchNode(node, doc)
  }

  for (const n of node.nodes) {
    const result = resolveMatch(n, doc)

    if (node.operator === '$and' && !result.value) {
      return nBoolean(false)
    }
    if (node.operator === '$nor' && result.value) {
      return nBoolean(false)
    }
    if (node.operator === '$or' && result.value) {
      return nBoolean(true)
    }
  }

  return nBoolean(node.operator !== '$or')
}

/**
 * Resolve parsed node into raw value.
 */
function resolveMatchNode(
  node: MatchArrayNode | MatchPathNode,
  doc: BSONNode,
): BooleanNode {
  const values = getPathValues(node.path, doc)
  if (!values.length) {
    values.push(nNullish())
  }

  // node result
  let result = false

  // if NOT negated: first matching value skips to next rule
  for (let li = 0; li < values.length && !result; li++) {
    const left = values[li]

    switch (node.kind) {
      case NodeKind.MATCH_ARRAY: {
        if (left.kind === NodeKind.ARRAY) {
          for (let i = 0; i < left.value.length && !result; i++) {
            result = resolveMatch(node.node, left.value[i]).value
          }
        }
        break
      }

      case NodeKind.MATCH_PATH: {
        const fn = expected(OPERATORS[node.operator])
        result = !!fn(left, ...node.args).value
        break
      }
    }
  }

  // First match XOR negated node
  return nBoolean(result !== node.negate)
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
