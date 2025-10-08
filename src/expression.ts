import {
  $abs,
  $add,
  $ceil,
  $divide,
  $exp,
  $floor,
  $ln,
  $log,
  $log10,
  $mod,
  $multiply,
  $pow,
  $round,
  $sqrt,
  $subtract,
  $trunc,
} from './expression/arithmetic.js'
import { $concatArrays, $in, $isArray, $size } from './expression/array.js'
import { $and, $not, $or } from './expression/boolean.js'
import {
  $cmp,
  $eq,
  $gt,
  $gte,
  $lt,
  $lte,
  $ne,
} from './expression/comparison.js'
import { $cond, $ifNull, $switch } from './expression/conditional.js'
import {
  $convert,
  $isNumber,
  $toBool,
  $toDate,
  $toDouble,
  $toLong,
  $toObjectId,
  $toString,
  $type,
} from './expression/type.js'
import { $$CLUSTER_TIME, $$NOW, $$ROOT } from './expression/variables.js'
import { normalizeArguments, unwrapBSON, wrapBSON } from './lib/bson.js'
import {
  type BSONNode,
  type Node,
  NodeKind,
  nNullish,
  nOperator,
  nString,
  type ObjectNode,
  type ProjectNode,
  type StringNode,
} from './lib/node.js'
import {
  type Operator,
  parseOperatorArguments,
  withParsing,
} from './lib/operator.js'
import { type Path, parsePath } from './lib/path.js'
import { parseProjection } from './lib/project.js'
import { expected } from './lib/util.js'

/**
 * https://www.mongodb.com/docs/v7.0/reference/aggregation-variables/
 * https://www.mongodb.com/docs/manual/reference/mql/expressions/
 */
const OPERATORS: Record<string, Operator | undefined> = {
  $$CLUSTER_TIME,
  $$NOW,
  $$ROOT,
  $abs,
  $add,
  $and,
  $ceil,
  $cmp,
  $concatArrays,
  $cond,
  $convert,
  $divide,
  $eq,
  $exp,
  $floor,
  $gt,
  $gte,
  $ifNull,
  $in,
  $isArray,
  $isNumber,
  /**
   * Hack (skip expression parsing)
   */
  $literal: withParsing(
    arg => arg,
    arg => [arg],
  ),
  $ln,
  $log,
  $log10,
  $lt,
  $lte,
  $mod,
  $multiply,
  $ne,
  $not,
  $or,
  $pow,
  $round,
  $size,
  $sqrt,
  $subtract,
  $switch,
  $toBool,
  $toDate,
  $toDouble,
  $toLong,
  $toObjectId,
  $toString,
  $trunc,
  $type,
}

/**
 * Compiles an aggregation expression into a map function.
 */
export function compileExpression(value: unknown) {
  const node = parseExpression(value)
  return <T = unknown>(value?: unknown): T => {
    return unwrapBSON(resolveExpression(node, wrapBSON(value))) as T
  }
}

/**
 * Recursive downgrade from `Node` to `BSONNode`.
 */
export function resolveExpression(node: Node, root: BSONNode): BSONNode {
  switch (node.kind) {
    case NodeKind.EXPRESSION:
    case NodeKind.MATCH_PATH:
      throw new Error(`Unexpected node kind: ${node.kind}`)

    // Apply operators
    case NodeKind.OPERATOR: {
      const fn = expected(OPERATORS[node.operator])

      const args = node.args.map(a => resolveExpression(a, root))
      if (fn.useRoot) {
        args.push(root)
      }

      return fn(...args)
    }

    // Resolve array items
    case NodeKind.NODE_ARRAY:
      return {
        kind: NodeKind.ARRAY,
        value: node.nodes.map(n => resolveExpression(n, root)),
      }

    // Resolve paths
    case NodeKind.PATH:
      return getPathValue(node.path, root)

    // Resolve expression objects
    case NodeKind.PROJECT: {
      if (node.exclusion) {
        throw new Error('TODO: exclusion')
      }

      const obj: ObjectNode = {
        kind: NodeKind.OBJECT,
        keys: [],
        value: {},
      }
      for (const n of node.nodes) {
        setPathValue(n.path, obj, resolveExpression(n.value, root))
      }

      return obj
    }

    // Should be a raw value
    default:
      return node
  }
}

/**
 * Parse both values and operators.
 */
export function parseExpression(value: unknown): Node {
  return expandNode(wrapBSON(value))
}

/**
 * Objects, strings, and arrays are "expanded" by default.
 */
function expandNode(node: Node): Node {
  switch (node.kind) {
    case NodeKind.ARRAY:
      return {
        kind: NodeKind.NODE_ARRAY,
        nodes: node.value.map(expandNode),
      }
    case NodeKind.OBJECT:
      return parseObjectNode(node)
    case NodeKind.STRING:
      return parseStringNode(node)
    default:
      return node
  }
}

/**
 * Apply operators and system variables.
 */
function parseStringNode({ value }: StringNode): Node {
  if (value[0] === '$' && value[1] === '$') {
    const fn = OPERATORS[value]
    if (!fn) {
      throw new TypeError(`Unsupported system variable: ${value}`)
    }
    return nOperator(value, parseOperatorArguments(fn, []))
  }

  if (value[0] === '$') {
    return {
      kind: NodeKind.PATH,
      path: parsePath(value.substring(1)),
      value: nString(value),
    }
  }

  return { kind: NodeKind.STRING, value }
}

function parseObjectNode(node: ObjectNode): Node {
  if (node.keys.length === 1 && node.keys[0][0] === '$') {
    const key = node.keys[0]

    const operator = OPERATORS[key]
    if (!operator) {
      throw new TypeError(`Unsupported expression operator: ${key}`)
    }

    const args: Node[] = parseOperatorArguments(
      operator,
      normalizeArguments(expected(node.value[key])),
    )

    for (let i = 0; i < args.length; i++) {
      const node = args[i]

      if (!operator.parseArguments) {
        args[i] = expandNode(node)
      } else if (node.kind === NodeKind.EXPRESSION) {
        args[i] = expandNode(node.expression)
      }
    }

    return nOperator(key, args)
  }

  const project = parseProjection(node)
  if (!project.exclusion) {
    expandInclusion(project)
    if (!project.nodes.some(n => n.path.length === 1 && n.path[0] === '_id')) {
      project.nodes.push({
        kind: NodeKind.PATH, // Setter
        path: ['_id'],
        value: {
          kind: NodeKind.PATH, // Getter
          path: ['_id'],
          value: wrapBSON('$_id'),
        },
      })
    }
  }

  return project
}

function expandInclusion(project: ProjectNode): void {
  for (let i = 0; i < project.nodes.length; i++) {
    const node = project.nodes[i]
    if (node.value.kind === NodeKind.PROJECT) {
      expandInclusion(node.value)
    } else {
      node.value = expandNode(node.value)
    }
  }
}

/**
 * Keeps only non-nullisth array items.
 */
export function getPathValue(path: Path, node: BSONNode): BSONNode {
  if (!path.length) {
    return node
  }
  if (node.kind === NodeKind.OBJECT) {
    return getPathValue(path.slice(1), node.value[path[0]] || nNullish())
  }

  if (node.kind === NodeKind.ARRAY) {
    const items: BSONNode[] = []

    for (let i = 0; i < node.value.length; i++) {
      const n = getPathValue(path, node.value[i])
      if (n.kind !== NodeKind.NULLISH) {
        items.push(n)
      }
    }

    if (items.length) {
      return { kind: NodeKind.ARRAY, value: items }
    }
  }

  return nNullish()
}

export function setPathValue(
  path: Path,
  obj: ObjectNode,
  node: BSONNode,
): void {
  for (let i = 0; i < path.length; i++) {
    const key = `${path[i]}`
    if (obj.value[key]) {
      throw new TypeError(`Unable to write value at ${path.join('.')}`)
    }

    obj.keys.push(key)

    if (i === path.length - 1) {
      obj.value[key] = node
    } else {
      const child: BSONNode = {
        kind: NodeKind.OBJECT,
        keys: [],
        value: {},
      }

      obj.value[key] = child
      obj = child
    }
  }
}
