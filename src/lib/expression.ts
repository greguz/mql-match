import { wrapNodes } from './bson.js'
import {
  type BSONNode,
  type ExpressionNode,
  NodeKind,
  nDate,
  nNullish,
  nTimestamp,
} from './node.js'
import type { Path } from './path.js'
import { expected } from './util.js'

/**
 * Represents the lower-level version of an expression operator.
 *
 * Some operators like `$cond` need to evaluate part of the nodes at runtime:
 * ```
 * $cond: {
 *   if: { $isArray: '$items' },
 *   then: { $size: '$items' },
 *   else: -1,
 * },
 * ```
 *
 * You need to evaluate `{ $size: '$items' }` ONLY IF `{ $isArray: '$items' }` is true,
 * otherwise the $size operator will (correctly) throw.
 */
export interface ExpressionOperator {
  /**
   * Operator implementation.
   */
  (ctx: ExpressionContext, ...args: ExpressionNode[]): BSONNode
  /**
   * Expected at least these arguments.
   */
  minArgs?: number
  /**
   * Expected at most these arguments.
   */
  maxArgs?: number
  /**
   * Parse and/or validate BSON arguments before any upcast from BSONNode to ExpressionNode.
   */
  parse?: (...args: BSONNode[]) => ExpressionNode[]
}

/**
 * Specialized (and most common) version of an expression operator.
 *
 * Parsing is done before any expression-related parsing, and arguments are pre-evaluated automatically.
 * See `wrapOperator` function.
 */
export interface ExpressionBSONOperator {
  /**
   * Operator implementation.
   */
  (...args: BSONNode[]): BSONNode
  /**
   * Expected at least these arguments.
   */
  minArgs?: number
  /**
   * Expected at most these arguments.
   */
  maxArgs?: number
  /**
   * Parse and/or validate raw BSON arguments.
   */
  parse?: (...args: BSONNode[]) => BSONNode[]
}

/**
 * Explicit number of arguments declaration.
 */
export function withArguments(
  fn: ExpressionOperator | ExpressionBSONOperator,
  minArgs: number,
  maxArgs?: number,
): void {
  if (fn.minArgs !== undefined || fn.maxArgs !== undefined) {
    throw new Error(`Operator ${fn.name} has already arguments specified`)
  }
  fn.minArgs = minArgs
  fn.maxArgs = maxArgs
}

/**
 * Custom arguments parsing.
 */
export function withParsing(
  fn: ExpressionOperator,
  parse: (...args: BSONNode[]) => ExpressionNode[],
): void
export function withParsing(
  fn: ExpressionBSONOperator,
  parse: (...args: BSONNode[]) => BSONNode[],
): void
export function withParsing(
  fn: ExpressionOperator | ExpressionBSONOperator,
  parse: (...args: BSONNode[]) => any[],
): void {
  if (fn.parse) {
    throw new Error(
      `Expression operator ${fn.name} cannot specify a custom arguments parser`,
    )
  }
  if (fn.minArgs === undefined && fn.maxArgs === undefined) {
    fn.minArgs = parse.length
    fn.maxArgs = parse.length
  }
  fn.parse = parse
}

/**
 * Validate and parse operator's arguments.
 */
export function parseOperatorArgs(
  fn: ExpressionOperator,
  argument: BSONNode,
): ExpressionNode[] {
  const minArgs = fn.minArgs ?? fn.length - 1
  const maxArgs = fn.maxArgs ?? minArgs

  // Normalize single argument into array of arguments
  let args: BSONNode[]
  if (argument.kind === NodeKind.ARRAY) {
    args = argument.value
  } else if (argument.kind !== NodeKind.NULLISH || minArgs > 0) {
    args = [argument]
  } else {
    args = []
  }

  if (args.length < minArgs) {
    throw new TypeError(
      `Operator ${fn.name} requires at least ${minArgs} arguments (got ${args.length})`,
    )
  }

  if (args.length > maxArgs) {
    throw new TypeError(
      `Operator ${fn.name} requires at most ${maxArgs} arguments (got ${args.length})`,
    )
  }

  return fn.parse ? fn.parse(...args) : args
}

/**
 * Upcast a BSON operator to a standard expression operator.
 */
export function wrapOperator(
  mapper: ExpressionBSONOperator,
): ExpressionOperator {
  const operator: ExpressionOperator = (ctx, ...args) => {
    // Downcast expression nodes into raw BSON values
    return mapper(...args.map(n => ctx.eval(n)))
  }

  // Keep the original operator's name
  Object.defineProperty(operator, 'name', {
    configurable: true,
    value: mapper.name,
  })

  // Keep operator's settings
  operator.minArgs = mapper.minArgs ?? mapper.length
  operator.maxArgs = mapper.maxArgs ?? operator.minArgs
  operator.parse = mapper.parse

  return operator
}

/**
 *
 */
export class ExpressionContext {
  /**
   * https://www.mongodb.com/docs/manual/reference/mql/expressions/
   */
  static operators: Record<string, ExpressionOperator> = {}

  /**
   * Current expression document.
   * Can be anything (`null`, `number`, etc...).
   */
  readonly root: BSONNode

  /**
   * @constructor
   */
  constructor(root: BSONNode) {
    this.root = root
  }

  /**
   * Evaluate an expression node.
   * Projections are NOT supported here.
   */
  eval(node: ExpressionNode): BSONNode {
    switch (node.kind) {
      case NodeKind.EXPRESSION_ARRAY:
        return wrapNodes(node.nodes.map(n => this.eval(n)))

      case NodeKind.EXPRESSION_GETTER:
        return evalExpressionGetter(node.path, this.root)

      case NodeKind.EXPRESSION_OBJECT: {
        const obj: BSONNode = {
          kind: NodeKind.OBJECT,
          keys: node.keys,
          value: {},
          raw: undefined,
        }

        for (let i = 0; i < node.keys.length; i++) {
          const key = node.keys[i]
          obj.value[key] = this.eval(expected(node.nodes[key]))
        }

        return obj
      }

      case NodeKind.EXPRESSION_OPERATOR: {
        const fn = expected(ExpressionContext.operators[node.operator])
        return fn(this, ...node.args)
      }

      case NodeKind.EXPRESSION_PROJECT:
        throw new Error('Unexpected projection node')

      case NodeKind.EXPRESSION_VARIABLE:
        return this.variable(node.variable)

      default:
        return node
    }
  }

  /**
   * Evaluates a variable.
   *
   * https://www.mongodb.com/docs/manual/reference/aggregation-variables/
   */
  variable(key: string): BSONNode {
    switch (key) {
      case '$$CLUSTER_TIME':
        return nTimestamp()
      case '$$NOW':
        return nDate()
      case '$$ROOT':
        return this.root
      default:
        throw new TypeError(`Unsupported system variable: ${key}`)
    }
  }
}

/**
 * Keeps only non-nullisth array items.
 */
export function evalExpressionGetter(path: Path, node: BSONNode): BSONNode {
  if (!path.length) {
    return node
  }
  if (node.kind === NodeKind.OBJECT) {
    const key = `${path[0]}`
    return evalExpressionGetter(path.slice(1), node.value[key] || nNullish(key))
  }

  if (node.kind === NodeKind.ARRAY) {
    const items: BSONNode[] = []

    for (let i = 0; i < node.value.length; i++) {
      const n = evalExpressionGetter(path, node.value[i])
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
