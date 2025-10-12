import { unwrapNumber } from '../lib/bson.js'
import {
  type BSONNode,
  type MatchNode,
  NodeKind,
  nDouble,
} from '../lib/node.js'
import { withQueryParsing } from '../lib/operator.js'
import { expected } from '../lib/util.js'
import { parseMatch, resolveMatch } from '../match.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pop/
 */
export function $pop(left: BSONNode, right: BSONNode): BSONNode {
  if (left.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$pop found an element of non-array type (got ${left.kind})`,
    )
  }

  if (right.value === -1) {
    expected(left.raw).shift()
    left.value.shift()
  } else {
    expected(left.raw).pop()
    left.value.pop()
  }

  return left
}

withQueryParsing($pop, arg => {
  const n = unwrapNumber(arg, `$pop expects a number (got ${arg.kind})`)
  if (n !== 1 && n !== -1) {
    throw new TypeError(`$pop expects 1 or -1 (got ${n})`)
  }
  return [nDouble(n)] as const
})

export function $pull(node: BSONNode, query: MatchNode): BSONNode {
  if (node.kind !== NodeKind.ARRAY) {
    return node
  }

  let i = 0
  while (i < node.value.length) {
    if (resolveMatch(query, node.value[i]).value) {
      expected(node.raw).splice(i, 1)
      node.value.splice(i, 1)
    } else {
      i++
    }
  }

  return node
}

withQueryParsing($pull, arg => [parseMatch(arg)] as const)
