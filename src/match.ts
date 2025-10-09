import { $and } from './expression/boolean.js'
import { $eq } from './expression/comparison.js'
import { $toBool } from './expression/type.js'
import { parseExpression, resolveExpression } from './expression.js'
import { wrapBSON } from './lib/bson.js'
import {
  type BSONNode,
  type Node,
  NodeKind,
  nBoolean,
  nNullish,
  nOperator,
} from './lib/node.js'
import { type Operator, parseOperatorArguments } from './lib/operator.js'
import { type Path, parsePath } from './lib/path.js'
import { expected, isPlainObject } from './lib/util.js'
import { $size } from './match/array.js'
import { $regex } from './match/miscellaneous.js'
import { $exists, $type } from './match/type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/mql/query-predicates/
 */
const OPERATORS: Record<string, Operator | undefined> = {
  $and,
  $eq: fromExpression($eq),
  $exists,
  $regex,
  $size,
  $type,
}

function fromExpression(fn: Operator): Operator {
  const copy: Operator = fn.bind(null)

  const minArgs = fn.minArgs ?? fn.length
  const maxArgs = fn.maxArgs ?? minArgs

  copy.minArgs = minArgs - 1
  copy.maxArgs = maxArgs - 1

  return copy
}

export function compileMatch(query: unknown = {}, options?: unknown) {
  const node = compilePredicate(isPlainObject(query) ? query : { $eq: query })
  return (value?: unknown): boolean => {
    return resolveMatch(node, wrapBSON(value)).value === true
  }
}

export function compilePredicate(predicate: Record<string, unknown>): Node {
  const nodes = Object.keys(predicate).map(key =>
    compilePredicateKey(key, predicate[key]),
  )

  switch (nodes.length) {
    case 0:
      return nBoolean(true)
    case 1:
      return nodes[0]
    default:
      return nOperator('$and', nodes)
  }
}

function compilePredicateKey(key: string, value: unknown): Node {
  if (key === '$expr') {
    return {
      kind: NodeKind.EXPRESSION,
      expression: parseExpression(value),
    }
  }

  const path = parsePath(key)

  if (isPlainObject(value)) {
    const keys = Object.keys(value)

    if (keys.some(k => k[0] === '$')) {
      // Special validation here
      if (value.$options && !value.$regex) {
        throw new TypeError('$options needs a $regex')
      }

      const args: Node[] = []

      for (const k of keys) {
        if (k !== '$options') {
          args.push(
            compileOperator(
              path,
              k,
              k === '$regex' ? value : value[k], // Funny :)
            ),
          )
        }

        return args.length === 1 ? args[0] : nOperator('$and', args)
      }
    }
  }

  return compileOperator(path, '$eq', value)
}

function compileOperator(path: Path, key: string, value: unknown): Node {
  const fn = OPERATORS[key]
  if (!fn) {
    throw new Error(`Unsupported match operator: ${key}`)
  }

  return {
    kind: NodeKind.MATCH_PATH,
    path,
    operator: key,
    right: nOperator(key, parseOperatorArguments(fn, [wrapBSON(value)])),
  }
}

/**
 * Resolve parsed node into raw value.
 */
export function resolveMatch(node: Node, root: BSONNode): BSONNode {
  switch (node.kind) {
    case NodeKind.NODE_ARRAY:
    case NodeKind.PATH:
    case NodeKind.PROJECT:
      throw new Error(`Unexpected node kind: ${node.kind}`)

    case NodeKind.EXPRESSION:
      return resolveExpression(node.expression, root)

    case NodeKind.OPERATOR: {
      const fn = expected(OPERATORS[node.operator])

      const args = node.args.map(n => resolveMatch(n, root))
      if (fn.useRoot) {
        args.push(root)
      }

      return fn(...args)
    }

    case NodeKind.MATCH_PATH: {
      const fn = expected(OPERATORS[node.operator])

      const values = getPathValues(node.path, root)
      if (!values.length) {
        values.push(nNullish())
      }

      for (const left of values) {
        const result = $toBool(fn(left, ...(node.right.args as BSONNode[]))) // TODO: Little hack here :)
        if (result.value) {
          return result
        }
      }

      return nBoolean(false)
    }

    default:
      return node
  }
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
