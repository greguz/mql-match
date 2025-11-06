import { $avg, $sum } from './expression/accumulators.js'
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
import { $regexMatch } from './expression/string.js'
import {
  $convert,
  $isNumber,
  $toBool,
  $toDate,
  $toDouble,
  $toInt,
  $toLong,
  $toObjectId,
  $toString,
  $type,
} from './expression/type.js'
import { $$CLUSTER_TIME, $$NOW, $$ROOT } from './expression/variables.js'
import { setKey, wrapNodes, wrapObjectRaw } from './lib/bson.js'
import {
  type BSONNode,
  type ExpressionNode,
  type ExpressionProjectNode,
  NodeKind,
  nNullish,
  nString,
  type ObjectNode,
  type StringNode,
} from './lib/node.js'
import { type ExpressionOperator, parseExpressionArgs } from './lib/operator.js'
import { type Path, parsePath } from './lib/path.js'
import { expected, includes } from './lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/aggregation-variables/
 * https://www.mongodb.com/docs/manual/reference/mql/expressions/
 */
const OPERATORS: Record<string, ExpressionOperator | undefined> = {
  $$CLUSTER_TIME,
  $$NOW,
  $$ROOT,
  $abs,
  $add,
  $and,
  $avg,
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
  $regexMatch,
  $round,
  $size,
  $sqrt,
  $subtract,
  $sum,
  $switch,
  $toBool,
  $toDate,
  $toDouble,
  $toInt,
  $toLong,
  $toObjectId,
  $toString,
  $trunc,
  $type,
}

/**
 * Parse both values and operators.
 */
export function parseExpression(arg: BSONNode): ExpressionNode {
  let withoutId = false
  if (
    arg.kind === NodeKind.OBJECT &&
    arg.value._id &&
    arg.value._id.value === 0
  ) {
    withoutId = true
    arg.keys = arg.keys.filter(k => k !== '_id')
    arg.value._id = undefined
  }

  const exp = parseExpressionInternal(arg)
  if (
    !withoutId &&
    exp.kind === NodeKind.EXPRESSION_PROJECT &&
    !exp.exclusion &&
    !includes(exp.keys, '_id')
  ) {
    exp.keys.push('_id')
    exp.values._id = {
      kind: NodeKind.EXPRESSION_GETTER,
      path: ['_id'],
    }
  }

  return exp
}

function parseExpressionInternal(node: ExpressionNode): ExpressionNode {
  switch (node.kind) {
    case NodeKind.ARRAY:
      return parseLiteralNode(node)
    case NodeKind.OBJECT:
      return parseObjectNode(node)
    case NodeKind.STRING:
      return parseStringNode(node)
    default:
      return node
  }
}

/**
 * Returns `true` for exclusion projections.
 */
function isExclusion(node: ExpressionNode): boolean {
  return node.kind === NodeKind.EXPRESSION_PROJECT ? node.exclusion : false
}

/**
 * Apply operators and system variables.
 */
function parseStringNode({ value }: StringNode): ExpressionNode {
  if (value[0] === '$' && value[1] === '$') {
    const fn = OPERATORS[value]
    if (!fn) {
      throw new TypeError(`Unsupported system variable: ${value}`)
    }
    return {
      kind: NodeKind.EXPRESSION_OPERATOR,
      operator: value,
      arg: parseExpressionArgs(fn, nNullish()),
    }
  }

  if (value[0] === '$') {
    return {
      kind: NodeKind.EXPRESSION_GETTER,
      path: parsePath(value.substring(1)),
    }
  }

  return nString(value)
}

function parseObjectNode(node: ObjectNode): ExpressionNode {
  if (isOperator(node)) {
    return parseOperatorNode(node)
  }

  const project: ExpressionProjectNode = {
    kind: NodeKind.EXPRESSION_PROJECT,
    keys: [],
    values: {},
    exclusion: false,
  }

  for (const key of node.keys) {
    const path = parsePath(key)
    const value = expected(node.value[key])

    if (value.value === true || value.value === 1) {
      // Inclusion node
      if (project.exclusion) {
        throw new TypeError(
          `Cannot do inclusion on field ${key} in exclusion projection`,
        )
      }

      setProjectionKey(project, path)
    } else if (value.value === false || value.value === 0) {
      // Exclusion node
      if (project.keys.length > 0 && !project.exclusion) {
        throw new TypeError(
          `Cannot do exclusion on field ${key} in inclusion projection`,
        )
      }

      project.exclusion = true
      setProjectionKey(project, path)
    } else {
      // Value node or nested projection
      const child = parseExpressionInternal(value)

      const exclusion = isExclusion(child)
      if (project.keys.length > 0 && project.exclusion !== exclusion) {
        throw new TypeError(
          project.exclusion
            ? `Cannot do inclusion on field ${key} in exclusion projection`
            : `Cannot do exclusion on field ${key} in inclusion projection`,
        )
      }

      project.exclusion = exclusion
      setProjectionKey(project, path, child)
    }
  }

  return project
}

function parseOperatorNode(node: ObjectNode): ExpressionNode {
  const key = node.keys[0]
  if (key === '$literal') {
    return expected(node.value[key])
  }

  const operator = OPERATORS[key]
  if (!operator) {
    throw new TypeError(`Unsupported expression operator: ${key}`)
  }

  return {
    kind: NodeKind.EXPRESSION_OPERATOR,
    operator: key,
    arg: parseExpressionInternal(
      parseExpressionArgs(operator, expected(node.value[key])),
    ),
  }
}

function setProjectionKey(
  project: ExpressionProjectNode,
  path: Path,
  value?: ExpressionNode,
): void {
  for (let i = 0; i < path.length; i++) {
    const key = `${path[i]}`
    if (!includes(project.keys, key)) {
      project.keys.push(key)
    }

    if (i < path.length - 1) {
      const child = project.values[key] || {
        kind: NodeKind.EXPRESSION_PROJECT,
        keys: [],
        values: {},
        exclusion: project.exclusion,
      }
      if (child.kind !== NodeKind.EXPRESSION_PROJECT) {
        throw new TypeError(`Path collision at ${path.join('.')}`)
      }
      project.values[key] = child
      project = child
    } else if (value) {
      project.values[key] = value
    }
  }
}

/**
 * Projection is ignored inside literals.
 * This "first" literal you can use to enter this mode is an array.
 */
function parseLiteralNode(node: BSONNode): ExpressionNode {
  switch (node.kind) {
    case NodeKind.ARRAY:
      return {
        kind: NodeKind.EXPRESSION_ARRAY,
        nodes: node.value.map(parseLiteralNode),
      }

    case NodeKind.OBJECT: {
      if (isOperator(node)) {
        return parseOperatorNode(node)
      }

      const obj: Record<string, ExpressionNode | undefined> = {}
      for (const key of node.keys) {
        obj[key] = parseLiteralNode(expected(node.value[key]))
      }
      return {
        kind: NodeKind.EXPRESSION_OBJECT,
        keys: node.keys,
        nodes: obj,
      }
    }

    case NodeKind.STRING:
      return parseStringNode(node)

    default:
      return node
  }
}

/**
 * Single key starting with "$" char.
 */
function isOperator(node: ObjectNode): boolean {
  return node.keys.length === 1 && node.keys[0][0] === '$'
}

/**
 * Recursive downcast from `ExpressionNode` to `BSONNode`.
 */
export function resolveExpression(
  expression: ExpressionNode,
  document: BSONNode,
): BSONNode {
  switch (expression.kind) {
    case NodeKind.EXPRESSION_OPERATOR: {
      const fn = expected(OPERATORS[expression.operator])

      let args: BSONNode[]
      if (expression.arg.kind === NodeKind.EXPRESSION_ARRAY) {
        args = expression.arg.nodes.map(n => resolveExpression(n, document))
      } else if (expression.arg.kind !== NodeKind.NULLISH) {
        args = [resolveExpression(expression.arg, document)]
      } else {
        args = []
      }

      // Apply operator options
      if (fn.useRoot) {
        args.push(document)
      }

      return resolveExpression(fn(...args), document)
    }

    case NodeKind.EXPRESSION_ARRAY:
      return wrapNodes(
        expression.nodes.map(n => resolveExpression(n, document)),
      )

    case NodeKind.EXPRESSION_GETTER:
      return getPathValue(expression.path, document)

    case NodeKind.EXPRESSION_OBJECT: {
      const obj: BSONNode = {
        kind: NodeKind.OBJECT,
        keys: expression.keys,
        value: {},
        raw: undefined,
      }

      for (let i = 0; i < expression.keys.length; i++) {
        const key = expression.keys[i]

        obj.value[key] = resolveExpression(
          expected(expression.nodes[key]),
          document,
        )
      }

      return obj
    }

    case NodeKind.EXPRESSION_PROJECT:
      return expression.exclusion
        ? applyExclusion(expression, document, document)
        : applyInclusion(expression, document, document)

    default:
      return expression
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
      return wrapNodes(items)
    }
  }

  return nNullish()
}

/**
 * Returns the projected value.
 */
export function applyExclusion(
  project: ExpressionProjectNode,
  document: BSONNode,
  projection: BSONNode,
): BSONNode {
  if (projection.kind === NodeKind.ARRAY) {
    const nodes: BSONNode[] = []
    for (let i = 0; i < projection.value.length; i++) {
      if (projection.value[i].kind !== NodeKind.NULLISH) {
        nodes.push(applyExclusion(project, document, projection.value[i]))
      }
    }
    return wrapNodes(nodes)
  }
  if (projection.kind !== NodeKind.OBJECT) {
    // Nothing to do
    return projection
  }

  const obj = wrapObjectRaw()

  for (const key of projection.keys) {
    // Key's value
    const value = expected(projection.value[key])

    // Child exclusion project (optional)
    const childProject = project.values[key]

    if (childProject) {
      if (childProject.kind !== NodeKind.EXPRESSION_PROJECT) {
        throw new Error('Expected exclusion projection')
      }
      setKey(obj, key, applyExclusion(childProject, document, value))
    } else if (!includes(project.keys, key)) {
      setKey(obj, key, value)
    }
  }

  return obj
}

/**
 * Returns the projected value.
 */
export function applyInclusion(
  project: ExpressionProjectNode,
  document: BSONNode,
  projection: BSONNode,
): BSONNode {
  if (projection.kind === NodeKind.ARRAY) {
    const nodes: BSONNode[] = []
    for (let i = 0; i < projection.value.length; i++) {
      if (projection.value[i].kind !== NodeKind.NULLISH) {
        nodes.push(applyInclusion(project, document, projection.value[i]))
      }
    }
    return wrapNodes(nodes)
  }

  // Project result
  const obj = wrapObjectRaw()

  for (const key of project.keys) {
    const value = getKeyValue(projection, key)

    const expression = project.values[key]

    if (!expression) {
      setKey(obj, key, value)
    } else if (expression.kind === NodeKind.EXPRESSION_PROJECT) {
      setKey(obj, key, applyInclusion(expression, document, value))
    } else {
      setKey(obj, key, resolveExpression(expression, document))
    }
  }

  return obj
}

function getKeyValue(node: BSONNode, key: string): BSONNode {
  return node.kind === NodeKind.OBJECT
    ? node.value[key] || nNullish()
    : nNullish()
}
