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
import { $regexMatch, $toLower } from './expression/string.js'
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
import { setKey, wrapNodes, wrapObjectRaw } from './lib/bson.js'
import {
  ExpressionContext,
  parseOperatorArgs,
  wrapOperator,
} from './lib/expression.js'
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
import { Path } from './lib/path.js'
import { expected } from './lib/util.js'

// Inject operators into ExpressionContext store
ExpressionContext.operators.$abs = wrapOperator($abs)
ExpressionContext.operators.$add = wrapOperator($add)
ExpressionContext.operators.$and = wrapOperator($and)
ExpressionContext.operators.$avg = wrapOperator($avg)
ExpressionContext.operators.$ceil = wrapOperator($ceil)
ExpressionContext.operators.$cmp = wrapOperator($cmp)
ExpressionContext.operators.$concatArrays = wrapOperator($concatArrays)
ExpressionContext.operators.$cond = $cond
ExpressionContext.operators.$convert = wrapOperator($convert)
ExpressionContext.operators.$divide = wrapOperator($divide)
ExpressionContext.operators.$eq = wrapOperator($eq)
ExpressionContext.operators.$exp = wrapOperator($exp)
ExpressionContext.operators.$floor = wrapOperator($floor)
ExpressionContext.operators.$gt = wrapOperator($gt)
ExpressionContext.operators.$gte = wrapOperator($gte)
ExpressionContext.operators.$ifNull = $ifNull
ExpressionContext.operators.$in = wrapOperator($in)
ExpressionContext.operators.$isArray = wrapOperator($isArray)
ExpressionContext.operators.$isNumber = wrapOperator($isNumber)
ExpressionContext.operators.$ln = wrapOperator($ln)
ExpressionContext.operators.$log = wrapOperator($log)
ExpressionContext.operators.$log10 = wrapOperator($log10)
ExpressionContext.operators.$lt = wrapOperator($lt)
ExpressionContext.operators.$lte = wrapOperator($lte)
ExpressionContext.operators.$mod = wrapOperator($mod)
ExpressionContext.operators.$multiply = wrapOperator($multiply)
ExpressionContext.operators.$ne = wrapOperator($ne)
ExpressionContext.operators.$not = wrapOperator($not)
ExpressionContext.operators.$or = wrapOperator($or)
ExpressionContext.operators.$pow = wrapOperator($pow)
ExpressionContext.operators.$regexMatch = wrapOperator($regexMatch)
ExpressionContext.operators.$round = wrapOperator($round)
ExpressionContext.operators.$size = wrapOperator($size)
ExpressionContext.operators.$sqrt = wrapOperator($sqrt)
ExpressionContext.operators.$subtract = wrapOperator($subtract)
ExpressionContext.operators.$sum = wrapOperator($sum)
ExpressionContext.operators.$switch = $switch
ExpressionContext.operators.$toBool = wrapOperator($toBool)
ExpressionContext.operators.$toDate = wrapOperator($toDate)
ExpressionContext.operators.$toDouble = wrapOperator($toDouble)
ExpressionContext.operators.$toInt = wrapOperator($toInt)
ExpressionContext.operators.$toLong = wrapOperator($toLong)
ExpressionContext.operators.$toLower = wrapOperator($toLower)
ExpressionContext.operators.$toObjectId = wrapOperator($toObjectId)
ExpressionContext.operators.$toString = wrapOperator($toString)
ExpressionContext.operators.$trunc = wrapOperator($trunc)
ExpressionContext.operators.$type = wrapOperator($type)

/**
 * Compiled expression function.
 */
export type Expression = (node: BSONNode) => BSONNode

/**
 * Compiled expression function (internal).
 */
export type ExpressionResolver = (
  doc: BSONNode,
  ctx: ExpressionContext,
) => BSONNode

/**
 * Parse and compile a BSON expression.
 */
export function compileExpression(node: BSONNode): Expression {
  const fn = compileExpressionNode(parseExpressionNode(node))
  return doc => fn(doc, new ExpressionContext(doc))
}

/**
 *
 */
export function parseExpressionNode(arg: BSONNode): ExpressionNode {
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
    !exp.keys.includes('_id')
  ) {
    exp.keys.push('_id')
    exp.values._id = {
      kind: NodeKind.EXPRESSION_GETTER,
      path: Path.parse('_id'),
    }
  }

  return exp
}

function parseExpressionInternal(node: BSONNode): ExpressionNode {
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
    // TODO: check supported variables
    return {
      kind: NodeKind.EXPRESSION_VARIABLE,
      variable: value,
    }
  }

  if (value[0] === '$') {
    return {
      kind: NodeKind.EXPRESSION_GETTER,
      path: Path.parse(value.substring(1)),
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
    const path = Path.parse(key)
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
  if (node.keys.length !== 1) {
    throw new Error('Malformed operator request')
  }

  const key = node.keys[0]
  const value = expected(node.value[key])

  if (key === '$literal') {
    return value
  }

  const fn = ExpressionContext.operators[key]
  if (!fn) {
    throw new TypeError(`Unsupported expression operator: ${key}`)
  }

  const args = parseOperatorArgs(fn, value)
  for (let i = 0; i < args.length; i++) {
    args[i] = parseLiteralNode(args[i])
  }

  return {
    kind: NodeKind.EXPRESSION_OPERATOR,
    operator: key,
    args,
  }
}

function setProjectionKey(
  project: ExpressionProjectNode,
  path: Path,
  value?: ExpressionNode,
): void {
  for (let i = 0; i < path.segments.length; i++) {
    const key = path.segments[i].raw
    if (!project.keys.includes(key)) {
      project.keys.push(key)
    }

    if (i < path.segments.length - 1) {
      const child = project.values[key] || {
        kind: NodeKind.EXPRESSION_PROJECT,
        keys: [],
        values: {},
        exclusion: project.exclusion,
      }
      if (child.kind !== NodeKind.EXPRESSION_PROJECT) {
        throw new TypeError(`Path collision at ${path.raw}`)
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
function parseLiteralNode(node: ExpressionNode): ExpressionNode {
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

export function compileExpressionNode(
  node: ExpressionNode,
): ExpressionResolver {
  if (node.kind !== NodeKind.EXPRESSION_PROJECT) {
    return (_doc, ctx) => ctx.eval(node)
  }
  if (node.exclusion) {
    return compileExclusion(node)
  }
  return compileInclusion(node)
}

function getKeyValue(node: BSONNode, key: string): BSONNode {
  return node.kind === NodeKind.OBJECT
    ? node.value[key] || nNullish()
    : nNullish()
}

/**
 * Set a projected key value into `obj`.
 * Extends the `ExpressionResolver` function.
 */
type KeyProjection = (
  doc: BSONNode,
  ctx: ExpressionContext,
  obj: ObjectNode,
) => void

/**
 *
 */
function merge(a: KeyProjection, b: KeyProjection): KeyProjection {
  return (doc, ctx, obj) => {
    a(doc, ctx, obj)
    b(doc, ctx, obj)
  }
}

export function compileExclusion(
  node: ExpressionProjectNode,
): ExpressionResolver {
  if (!node.exclusion) {
    throw new Error('Unexpected inclusion projection')
  }
  if (!node.keys.length) {
    throw new Error('Expected at least one projected field')
  }

  // Sub-projections
  let projectKeys: KeyProjection = () => {}

  for (const key of node.keys) {
    const value = node.values[key]
    if (value) {
      const project = compileExclusion(value as ExpressionProjectNode) // TODO: do not use "as"

      projectKeys = merge(projectKeys, (doc, ctx, obj) => {
        setKey(obj, key, project(getKeyValue(doc, key), ctx))
      })
    }
  }

  // Keys to exclude from the resulting object
  const excludedKeys = node.keys

  // Adds the recursive array projection to key projections
  const projectDocument: ExpressionResolver = (doc, ctx) => {
    if (doc.kind === NodeKind.ARRAY) {
      const items: BSONNode[] = []
      for (let i = 0; i < doc.value.length; i++) {
        if (doc.value[i].kind !== NodeKind.NULLISH) {
          items.push(projectDocument(doc.value[i], ctx))
        }
      }
      return wrapNodes(items)
    }

    // Exclusion works only with objects
    if (doc.kind !== NodeKind.OBJECT) {
      return doc
    }

    const obj = wrapObjectRaw()

    for (let i = 0; i < doc.keys.length; i++) {
      if (!excludedKeys.includes(doc.keys[i])) {
        setKey(obj, doc.keys[i], getKeyValue(doc, doc.keys[i]))
      }
    }

    projectKeys(doc, ctx, obj)
    return obj
  }

  return projectDocument
}

export function compileInclusion(
  node: ExpressionProjectNode,
): ExpressionResolver {
  if (node.exclusion) {
    throw new Error('Unexpected exclusion projection')
  }
  if (!node.keys.length) {
    throw new Error('Expected at least one projected field')
  }

  const fns: KeyProjection[] = []

  for (const key of node.keys) {
    const expression = node.values[key]

    if (!expression) {
      fns.push((doc, _ctx, obj) => {
        setKey(obj, key, getKeyValue(doc, key))
      })
    } else if (expression.kind === NodeKind.EXPRESSION_PROJECT) {
      const project = compileInclusion(expression)

      fns.push((doc, ctx, obj) => {
        setKey(obj, key, project(getKeyValue(doc, key), ctx))
      })
    } else {
      fns.push((_doc, ctx, obj) => {
        setKey(obj, key, ctx.eval(expression))
      })
    }
  }

  // Merge all key projections into one
  const projectKeys = fns.reduce(merge)

  // Adds the recursive array projection to key projections
  const projectDocument: ExpressionResolver = (doc, ctx) => {
    if (doc.kind === NodeKind.ARRAY) {
      const items: BSONNode[] = []
      for (let i = 0; i < doc.value.length; i++) {
        if (doc.value[i].kind !== NodeKind.NULLISH) {
          items.push(projectDocument(doc.value[i], ctx))
        }
      }
      return wrapNodes(items)
    }

    const obj = wrapObjectRaw()
    projectKeys(doc, ctx, obj)
    return obj
  }

  return projectDocument
}
