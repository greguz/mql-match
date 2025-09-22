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
import {
  $convert,
  $isNumber,
  $toBool,
  $toDouble,
  $toObjectId,
  $toString,
  $type,
} from './expression/type.js'
import { $$CLUSTER_TIME, $$NOW, $$ROOT } from './expression/variables.js'
import { normalizeArguments, wrapBSON } from './lib/bson.js'
import {
  type BSONNode,
  type Node,
  NodeKind,
  nGetter,
  nNullish,
  nObject,
  nOperator,
  nProjection,
  nSetter,
  type SetterNode,
} from './lib/node.js'
import {
  type Context,
  type Operator,
  parseOperatorArguments,
  withoutExpansion,
} from './lib/operator.js'
import { getPathValue, setPathValue, unsetPathValue } from './lib/path.js'
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
  $convert,
  $divide,
  $eq,
  $exp,
  $floor,
  $gt,
  $gte,
  $isNumber,
  $literal: withoutExpansion(([arg]) => arg),
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
  $sqrt,
  $subtract,
  $toBool,
  $toDouble,
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
  return (value?: unknown): BSONNode['value'] => {
    const root = wrapBSON(value)
    const ctx: Context = {
      root,
      source: root,
      target: nNullish(),
    }
    return resolveExpression(node, ctx).value
  }
}

/**
 * Recursive downgrade from `Node` to `BSONNode`.
 */
export function resolveExpression(node: Node, ctx: Context): BSONNode {
  switch (node.kind) {
    // Shouldn't be here (recursive resoluzione is done during build time)
    case NodeKind.EXPRESSION: {
      throw new Error(`Unexpected node kind: ${node.kind}`)
    }

    // Apply operators
    case NodeKind.OPERATOR: {
      const fn = expected(OPERATORS[node.operator])
      const args = node.args.map(a => resolveExpression(a, ctx))
      return resolveExpression(fn(args), ctx)
    }

    // Resolve array items
    case NodeKind.NODE_ARRAY:
      return {
        kind: NodeKind.ARRAY,
        value: node.nodes.map(n => resolveExpression(n, ctx)),
      }

    // Resolve paths
    case 'GETTER': {
      return wrapBSON(getPathValue(node.path, ctx.source.value))
    }

    //
    case 'SETTER': {
      setPathValue(
        node.path,
        ctx.target.value,
        resolveExpression(node.node, ctx).value,
      )
      return ctx.target // TODO: huh?
    }

    //
    case 'DELETER': {
      unsetPathValue(node.path, ctx.target.value)
      return ctx.target // TODO: huh?
    }

    // Resolve expression objects
    case 'PROJECTION': {
      const scope: Context = {
        root: ctx.root,
        source: ctx.source,
        target: nObject({}),
      }
      for (const n of node.nodes) {
        resolveExpression(n, scope)
      }
      return scope.target
    }

    // Should be a raw value
    default:
      return node
  }
}

/**
 * Objects, strings, and arrays are "expanded" by default.
 */
function expandNode(node: Node): Node {
  switch (node.kind) {
    case NodeKind.ARRAY:
      return {
        kind: NodeKind.NODE_ARRAY,
        nodes: node.value.map(parseExpression),
      }
    case NodeKind.OBJECT:
      return parseObjectNode(node.value)
    case NodeKind.STRING:
      return parseStringNode(node.value)
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
 * Apply operators and system variables.
 */
function parseStringNode(value: string): Node {
  if (value[0] === '$' && value[1] === '$') {
    const fn = OPERATORS[value]
    if (!fn) {
      throw new TypeError(`Unsupported system variable: ${value}`)
    }
    return {
      kind: NodeKind.OPERATOR,
      operator: value,
      args: parseOperatorArguments(fn, []),
    }
  }

  if (value[0] === '$') {
    return nGetter(value.substring(1))
  }

  return { kind: NodeKind.STRING, value }
}

function parseObjectNode(obj: Record<string, unknown>): Node {
  const keys = Object.keys(obj)

  if (keys.length === 1 && keys[0][0] === '$') {
    const key = keys[0]

    const operator = OPERATORS[key]
    if (!operator) {
      throw new TypeError(`Unsupported expression operator: ${key}`)
    }

    const args: Node[] = parseOperatorArguments(
      operator,
      normalizeArguments(obj[key]),
    )

    for (let i = 0; i < args.length; i++) {
      const node = args[i]

      if (!operator.parse) {
        args[i] = expandNode(node)
      } else if (node.kind === NodeKind.EXPRESSION) {
        args[i] = parseExpression(node.expression)
      }
    }

    return nOperator(key, args)
  }

  const nodes: SetterNode[] = []

  for (const key of keys) {
    const value = obj[key]
    if (value === 0 || value === false) {
      throw new Error('Omit is currently not supported')
    }

    if (value === 1 || value === true) {
      nodes.push(nSetter(key, nGetter(key)))
    } else {
      nodes.push(nSetter(key, parseExpression(value)))
    }
  }

  return nProjection(nodes)
}
