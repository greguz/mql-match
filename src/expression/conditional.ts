import {
  type ExpressionContext,
  withArguments,
  withParsing,
} from '../lib/expression.js'
import {
  type BSONNode,
  type ExpressionNode,
  NodeKind,
  nNullish,
} from '../lib/node.js'
import { expected } from '../lib/util.js'
import { $toBool } from './type.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/
 */
export function $cond(
  ctx: ExpressionContext,
  nIf: ExpressionNode,
  nThen: ExpressionNode,
  nElse: ExpressionNode,
): BSONNode {
  return $toBool(ctx.eval(nIf)).value ? ctx.eval(nThen) : ctx.eval(nElse)
}

withArguments($cond, 1, 3)

withParsing($cond, (...args) => {
  if (args.length === 3) {
    return args
  }
  if (args.length !== 1 || args[0].kind !== NodeKind.OBJECT) {
    throw new TypeError('Expression $cond takes exactly 3 arguments')
  }

  const ifNode = args[0].value.if
  if (!ifNode) {
    throw new TypeError("Missing 'if' parameter to $cond")
  }

  const thenNode = args[0].value.then
  if (!thenNode) {
    throw new TypeError("Missing 'then' parameter to $cond")
  }

  const elseNode = args[0].value.else
  if (!elseNode) {
    throw new TypeError("Missing 'else' parameter to $cond")
  }

  return [ifNode, thenNode, elseNode]
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/switch/
 */
export function $switch(
  ctx: ExpressionContext,
  ...args: ExpressionNode[]
): BSONNode {
  for (let i = 0; i < args.length - 1; i += 2) {
    if ($toBool(ctx.eval(args[i])).value) {
      return ctx.eval(args[i + 1])
    }
  }

  if (args.length % 2 === 0) {
    // The "default" branch isn't specified
    throw new Error(
      'Cannot execute a switch statement where all the cases evaluate to false without a default',
    )
  }

  // Returns the "default" branch
  return ctx.eval(args[args.length - 1])
}

withParsing($switch, arg => {
  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError(
      `$switch requires an object as an argument (found ${arg.kind})`,
    )
  }

  const branchesNode = arg.value.branches || nNullish('branches')
  if (branchesNode.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$switch expected an array for 'branches' (found ${branchesNode.kind})`,
    )
  }
  if (branchesNode.value.length < 1) {
    throw new TypeError('$switch requires at least one branch')
  }

  const results: BSONNode[] = []
  for (let i = 0; i < branchesNode.value.length; i++) {
    const branchNode = branchesNode.value[i]
    if (branchNode.kind !== NodeKind.OBJECT) {
      throw new TypeError(
        `$switch expected each branch to be an object (found ${branchNode.kind})`,
      )
    }

    const caseNode = branchNode.value.case
    if (!caseNode) {
      throw new TypeError(
        "$switch requires each branch have a 'case' expression",
      )
    }

    const thenNode = branchNode.value.then
    if (!thenNode) {
      throw new TypeError(
        "$switch requires each branch have a 'case' expression",
      )
    }

    results.push(caseNode, thenNode)
  }

  const defaultNode = arg.value.default
  if (defaultNode) {
    results.push(defaultNode)
  }

  return results
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/
 */
export function $ifNull(
  ctx: ExpressionContext,
  ...args: ExpressionNode[]
): BSONNode {
  for (let i = 0; i < args.length - 1; i++) {
    const value = ctx.eval(args[i])
    if (value.kind !== NodeKind.NULLISH) {
      return value
    }
  }
  return ctx.eval(expected(args[args.length - 1]))
}

withArguments($ifNull, 1, Number.POSITIVE_INFINITY)
