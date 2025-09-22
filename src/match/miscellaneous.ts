import { parseExpression } from '../expression.js'
import { type BSONNode, type Node, NodeKind } from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/expr/
 */
export function $expr(arg: BSONNode): Node {
  return {
    kind: NodeKind.EXPRESSION,
    expression: parseExpression({ $toBool: arg.value }),
  }
}
