import { compileExpression } from './expression.js'
import { setKey, wrapObjectRaw } from './lib/bson.js'
import type { MatchOperatorConstructor } from './lib/match.js'
import {
  type BooleanNode,
  type BSONNode,
  type MatchArrayNode,
  type MatchExpressionNode,
  type MatchNode,
  type MatchPathNode,
  type MatchSequenceNode,
  NodeKind,
  nBoolean,
  nMissing,
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
 * Returns a boolean that indicates when the match is ok.
 */
export type MatchQuery = (doc: BSONNode) => BooleanNode

/**
 * Compiles from BSON to usable match function.
 */
export function compileMatch(node: BSONNode): MatchQuery {
  return compileMatchNode(parseMatchNode(node))
}

/**
 * Parses from BSON node to `MatchNode` AST.
 */
export function parseMatchNode(query: BSONNode): MatchNode {
  if (query.kind !== NodeKind.OBJECT) {
    return {
      kind: NodeKind.MATCH_SEQUENCE,
      operator: '$and',
      nodes: Array.from(
        parseOperator(
          new Path('', false),
          query.kind === NodeKind.REGEX ? '$eq' : '$regex',
          query,
        ),
      ),
    }
  }

  const $and: MatchSequenceNode = {
    kind: NodeKind.MATCH_SEQUENCE,
    operator: '$and',
    nodes: [],
  }

  for (const key of query.keys) {
    const value = expected(query.value[key])

    // Handle direct path values
    if (key[0] !== '$') {
      $and.nodes.push(...parseMatchKey(Path.parse(key), value))
      continue
    }

    // Handle operators
    switch (key) {
      case '$expr': {
        const obj = wrapObjectRaw()
        setKey(obj, '$toBool', value)
        $and.nodes.push({
          kind: NodeKind.MATCH_EXPRESSION,
          expression: obj,
        })
        break
      }

      case '$and': {
        if (value.kind !== NodeKind.ARRAY || !value.value.length) {
          throw new TypeError(`Operator ${key} expects a non-empty array`)
        }
        for (const item of value.value) {
          const child = parseMatchNode(item)

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
          nodes: value.value.map(parseMatchNode),
        })
        break
      }

      default:
        $and.nodes.push(...parseOperator(new Path('', false), key, value))
        break
    }
  }

  return $and
}

function* parseMatchKey(
  path: Path,
  node: BSONNode,
): Generator<MatchArrayNode | MatchPathNode> {
  if (node.kind === NodeKind.OBJECT) {
    if (node.keys.some(k => k[0] === '$')) {
      yield* parseMatchObject(node, path)
      return
    }
  }

  yield* parseOperator(
    path,
    node.kind === NodeKind.REGEX ? '$regex' : '$eq',
    node,
  )
}

function* parseMatchObject(
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
      yield* parseOperator(
        path,
        k,
        k === '$regex' ? node : expected(node.value[k]),
      )
    }
  }
}

function* parseOperator(
  path: Path,
  key: string,
  value: BSONNode,
): Generator<MatchArrayNode | MatchPathNode> {
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
        yield* parseMatchKey(path, item)
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
      node: parseMatchNode(value),
      negate: false,
    }
    return
  }

  if (key === '$not') {
    if (value.kind !== NodeKind.OBJECT) {
      throw new TypeError('$not needs an Object')
    }
    for (const n of parseMatchObject(value, path)) {
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

/**
 * Compiles into usable function from `MatchNode` AST.
 */
export function compileMatchNode(node: MatchNode): MatchQuery {
  switch (node.kind) {
    case NodeKind.MATCH_ARRAY:
      return compileArrayMatch(node)
    case NodeKind.MATCH_EXPRESSION:
      return compileMatchExpression(node)
    case NodeKind.MATCH_PATH:
      return compileMatchPath(node)
    case NodeKind.MATCH_SEQUENCE:
      return compileMatchSequence(node)
  }
}

function compileArrayMatch(node: MatchArrayNode): MatchQuery {
  const match = compileMatchNode(node.node)

  return doc => {
    const values = getPathValues(node.path.segments, doc)
    if (!values.length) {
      values.push(nMissing(node.path.raw))
    }

    // node result
    let result = false

    // if NOT negated: first matching value skips to next rule
    for (let j = 0; j < values.length && !result; j++) {
      const n = values[j]
      if (n.kind === NodeKind.ARRAY) {
        for (let k = 0; k < n.value.length && !result; k++) {
          result = match(n.value[k]).value
        }
      }
    }

    // First match XOR negated node
    return nBoolean(result !== node.negate)
  }
}

function compileMatchExpression(node: MatchExpressionNode): MatchQuery {
  const fn = compileExpression(node.expression)
  return doc => nBoolean(fn(doc).value === true)
}

function compileMatchPath(node: MatchPathNode): MatchQuery {
  return doc => {
    const values = getPathValues(node.path.segments, doc)
    if (!values.length) {
      values.push(nMissing(node.path.raw))
    }

    // node result
    let result = false

    // if NOT negated: first matching value skips to next rule
    for (let i = 0; i < values.length && !result; i++) {
      result = node.operator(values[i]).value
    }

    // First match XOR negated node
    return nBoolean(result !== node.negate)
  }
}

function compileMatchSequence(node: MatchSequenceNode): MatchQuery {
  if (node.nodes.length <= 0) {
    throw new TypeError('$and/$or/$nor must be a nonempty array')
  }

  if (node.nodes.length === 1) {
    switch (node.operator) {
      case '$and':
      case '$or':
        return compileMatchNode(node.nodes[0])
      case '$nor':
        return negate(compileMatchNode(node.nodes[0]))
    }
  }

  const queries = node.nodes.map(compileMatchNode)

  switch (node.operator) {
    case '$and':
      return doc => {
        let result = nBoolean(true)
        for (let i = 0; i < queries.length && result.value; i++) {
          result = queries[i](doc)
        }
        return result
      }

    case '$or':
      return doc => {
        let result = nBoolean(false)
        for (let i = 0; i < queries.length && !result.value; i++) {
          result = queries[i](doc)
        }
        return result
      }

    case '$nor':
      return negate(doc => {
        let result = nBoolean(false)
        for (let i = 0; i < queries.length && !result.value; i++) {
          result = queries[i](doc)
        }
        return result
      })
  }
}

function negate(fn: MatchQuery): MatchQuery {
  return doc => nBoolean(!fn(doc).value)
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
