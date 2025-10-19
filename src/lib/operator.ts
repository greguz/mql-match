import { wrapNodes } from './bson.js'
import {
  type BSONNode,
  type ExpressionNode,
  NodeKind,
  nNullish,
} from './node.js'

/**
 * A mutation function that takes N BSON arguments and returns one BSON result.
 */
export interface ExpressionOperator<T extends BSONNode[] = BSONNode[]> {
  /**
   * Operator spec.
   */
  (...args: T): BSONNode
  /**
   * @default operator.length
   */
  minArgs?: number
  /**
   * @default minArgs
   */
  maxArgs?: number
  /**
   * Maps from X input arguments to Y input arguments.
   */
  parse?: (...args: BSONNode[]) => T
  /**
   * Push root value into Operator's arguments.
   */
  useRoot?: boolean
}

/**
 * Explicit number of arguments declaration.
 */
export function withArguments<T extends BSONNode[]>(
  operator: ExpressionOperator<T>,
  minArgs: number,
  maxArgs?: number,
) {
  if (operator.minArgs !== undefined || operator.maxArgs !== undefined) {
    throw new Error(`Operator ${operator.name} has already arguments specified`)
  }
  operator.minArgs = minArgs
  operator.maxArgs = maxArgs
}

/**
 * Custom arguments parsing.
 */
export function withParsing<T extends BSONNode[]>(
  operator: ExpressionOperator<T>,
  parse: (...args: BSONNode[]) => T,
) {
  if (operator.parse) {
    throw new Error(
      `Expression operator ${operator.name} cannot specify a custom arguments parser`,
    )
  }
  if (operator.minArgs === undefined && operator.maxArgs === undefined) {
    operator.minArgs = parse.length
    operator.maxArgs = parse.length
  }
  operator.parse = parse
}

/**
 * TODO: hacky
 */
export function useRoot(operator: ExpressionOperator) {
  if (operator.useRoot !== undefined) {
    throw new Error() // TODO
  }
  if (operator.minArgs === undefined && operator.maxArgs === undefined) {
    operator.minArgs = operator.length - 1
    operator.maxArgs = operator.length - 1
  }
  operator.useRoot = true
}

/**
 * Parse arguments validate arguments array.
 */
export function parseExpressionArgs(
  operator: ExpressionOperator,
  node: BSONNode,
): ExpressionNode {
  const minArgs = operator.minArgs ?? operator.length
  const maxArgs = operator.maxArgs ?? minArgs

  const args = normalizeExpressionArgs(node)
  if (minArgs === maxArgs && args.length !== minArgs) {
    throw new TypeError(
      `Operator ${operator.name} requires ${minArgs} arguments (got ${args.length})`,
    )
  }
  if (args.length < minArgs) {
    throw new TypeError(
      `Operator ${operator.name} requires at least ${minArgs} arguments (got ${args.length})`,
    )
  }
  if (args.length > maxArgs) {
    throw new TypeError(
      `Operator ${operator.name} requires at most ${maxArgs} arguments (got ${args.length})`,
    )
  }

  // The Operators knows what to do
  if (operator.parse) {
    return wrapNodes(operator.parse(...args))
  }

  // Leave non-array nodes as-is (can be mapped into something else later)
  if (node.kind !== NodeKind.ARRAY) {
    return node
  }

  // Ensure correct number of arguments
  if (Number.isFinite(maxArgs)) {
    while (args.length < maxArgs) {
      args.push(nNullish())
    }
  }

  return wrapNodes(args)
}

/**
 * Prepare operator's arguments array.
 */
export function normalizeExpressionArgs(arg: BSONNode): BSONNode[] {
  switch (arg.kind) {
    case NodeKind.ARRAY:
      return [...arg.value]
    case NodeKind.NULLISH:
      return []
    default:
      return [arg]
  }
}

/**
 * Both match and update query types.
 */
export interface QueryOperator<T extends unknown[] = unknown[]> {
  /**
   * Accepts the current document's value and the operator's argument.
   * Returns the the document's value.
   */
  (value: BSONNode, ...args: T): BSONNode
  /**
   * Custom query arguments parsing function.
   * By default take the query as-is.
   */
  parse?: (...args: BSONNode[]) => T
  /**
   * Update operators.
   * When `true` replaces the field's value with its parent and key nodes.
   */
  useParent?: boolean
}

export function withQueryParsing<T extends unknown[]>(
  operator: QueryOperator<T>,
  parse: (...args: BSONNode[]) => T,
): void {
  if (operator.parse !== undefined) {
    throw new Error(
      `Query operator ${operator.name} cannot have multiple parsers`,
    )
  }
  operator.parse = parse
}

/**
 * This will inject a second heading arguments during query resolution.
 * This means that the parsing function must ignore the first 2 arguments.
 */
export function useParent<T extends unknown[]>(
  operator: QueryOperator<[BSONNode, ...T]>,
  parse?: (...args: BSONNode[]) => T,
): void {
  if (operator.useParent !== undefined) {
    throw new Error('Double useParent assignment')
  }
  operator.useParent = true
  if (parse) {
    withQueryParsing(operator, parse as any) // hacky
  }
}

export function parseQueryArgs<T extends unknown[]>(
  operator: QueryOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}

export interface PipelineOperator<T extends unknown[] = unknown[]> {
  /**
   * Accepts an iterable and returns a new iterable.
   */
  (docs: Iterable<BSONNode>, ...args: T): Iterable<BSONNode>
  /**
   * Maps from X input arguments to Y input arguments.
   */
  parse?: (arg: BSONNode) => T
}

export function withStageParsing<T extends unknown[]>(
  operator: PipelineOperator<T>,
  parse: (...args: BSONNode[]) => T,
): void {
  if (operator.parse !== undefined) {
    throw new Error(
      `Pipeline operator ${operator.name} cannot have multiple parsers`,
    )
  }
  operator.parse = parse
}

export function parsePipelineArgs<T extends unknown[]>(
  operator: PipelineOperator<T>,
  arg: BSONNode,
): T {
  return operator.parse ? operator.parse(arg) : ([arg] as T)
}
