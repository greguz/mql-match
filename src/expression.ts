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

export function evalExpression(node: ExpressionNode, document: BSONNode) {
  const ctx = new ExpressionContext(document)

  switch (node.kind) {
    case NodeKind.EXPRESSION_PROJECT:
      return node.exclusion
        ? applyExclusion(node, ctx.root, ctx.root)
        : applyInclusion(node, ctx, ctx.root)
    default:
      return ctx.eval(node)
  }
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
    } else if (!project.keys.includes(key)) {
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
  ctx: ExpressionContext,
  projection: BSONNode,
): BSONNode {
  if (projection.kind === NodeKind.ARRAY) {
    const nodes: BSONNode[] = []
    for (let i = 0; i < projection.value.length; i++) {
      if (projection.value[i].kind !== NodeKind.NULLISH) {
        nodes.push(applyInclusion(project, ctx, projection.value[i]))
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
      setKey(obj, key, applyInclusion(expression, ctx, value))
    } else {
      setKey(obj, key, ctx.eval(expression))
    }
  }

  return obj
}

function getKeyValue(node: BSONNode, key: string): BSONNode {
  return node.kind === NodeKind.OBJECT
    ? node.value[key] || nNullish()
    : nNullish()
}
