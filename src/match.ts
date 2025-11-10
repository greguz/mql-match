import { evalExpression, parseExpression } from './expression.js'
import type { MatchOperatorConstructor } from './lib/match.js'
import {
  type BooleanNode,
  type BSONNode,
  type MatchArrayNode,
  type MatchNode,
  type MatchPathNode,
  type MatchSequenceNode,
  NodeKind,
  nBoolean,
  nMissing,
  nNullish,
  type ObjectNode,
} from './lib/node.js'
import { Path, type PathSegment } from './lib/path.js'
import { expected } from './lib/util.js'
import { $size } from './match/array.js'
import { $eq, $gt, $gte, $in, $lt, $lte } from './match/comparison.js'
import { $mod, $regex } from './match/miscellaneous.js'
import { $exists, $type } from './match/type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/mql/query-predicates/
 */
const OPERATORS: Record<string, MatchOperatorConstructor | undefined> = {
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
    $and.nodes.push(
      ...compileOperator(
        new Path('', false),
        query.kind === NodeKind.REGEX ? '$eq' : '$regex',
        query,
      ),
    )

    return $and.nodes.length === 1 ? $and.nodes[0] : $and
  }

  for (const key of query.keys) {
    const value = expected(query.value[key])

    // Handle direct path values
    if (key[0] !== '$') {
      $and.nodes.push(...compilePredicateKey(Path.parse(key), value))
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
        $and.nodes.push(...compileOperator(new Path('', false), key, value))
        break
    }
  }

  return $and.nodes.length === 1 ? $and.nodes[0] : $and
}

function* compilePredicateKey(
  path: Path,
  node: BSONNode,
): Generator<MatchArrayNode | MatchPathNode> {
  if (node.kind === NodeKind.OBJECT) {
    if (node.keys.some(k => k[0] === '$')) {
      yield* compilePredicateObject(node, path)
      return
    }
  }

  yield* compileOperator(
    path,
    node.kind === NodeKind.REGEX ? '$regex' : '$eq',
    node,
  )
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

  if (key === '$all') {
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError('$all needs an array')
    }

    if (value.value.length === 0) {
      // When passed an empty array, $all matches no documents.
      yield {
        kind: NodeKind.MATCH_PATH,
        path,
        operator: () => nBoolean(false),
        negate: false,
      }
    } else {
      // Match a list of sub-queries
      for (const item of value.value) {
        yield* compilePredicateKey(path, item)
      }
    }

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
    operator: fn(value),
    negate,
  }
}

export function evalMatch(node: MatchNode, doc: BSONNode): BooleanNode {
  if (node.kind === NodeKind.MATCH_EXPRESSION) {
    // $toBool was added during parsing
    return nBoolean(evalExpression(node.expression, doc).value === true)
  }

  if (node.kind !== NodeKind.MATCH_SEQUENCE) {
    return resolveMatchNode(node, doc)
  }

  for (const n of node.nodes) {
    const result = evalMatch(n, doc)

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
  const values = getPathValues(node.path.segments, doc)
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
            result = evalMatch(node.node, left.value[i]).value
          }
        }
        break
      }

      case NodeKind.MATCH_PATH: {
        result = node.operator(left).value
        break
      }
    }
  }

  // First match XOR negated node
  return nBoolean(result !== node.negate)
}

export function getPathValues(
  path: PathSegment[],
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
    const child = node.value[path[0].raw]
    if (child) {
      getPathValues(path.slice(1), child, results)
    } else {
      results.push(nMissing(path[0].raw))
    }
  }

  return results
}
