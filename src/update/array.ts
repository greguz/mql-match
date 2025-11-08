import { $eq } from '../expression/comparison.js'
import { assertBSON, unwrapBSON, unwrapNumber, wrapNodes } from '../lib/bson.js'
import {
  type ArrayNode,
  type BSONNode,
  type DoubleNode,
  type MatchNode,
  NodeKind,
  type NullishNode,
  nDouble,
  nNullish,
} from '../lib/node.js'
import { withParsing } from '../lib/update.js'
import { expected } from '../lib/util.js'
import { evalMatch, parseMatch } from '../match.js'

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

withParsing($pop, arg => {
  const n = unwrapNumber(arg, `$pop expects a number (got ${arg.kind})`)
  if (n !== 1 && n !== -1) {
    throw new TypeError(`$pop expects 1 or -1 (got ${n})`)
  }
  return [nDouble(n)] as const
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pull/
 */
export function $pull(node: BSONNode, query: MatchNode): BSONNode {
  if (node.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$pull found an element of non-array type (got ${node.kind})`,
    )
  }

  let i = 0
  while (i < node.value.length) {
    if (evalMatch(query, node.value[i]).value) {
      expected(node.raw).splice(i, 1)
      node.value.splice(i, 1)
    } else {
      i++
    }
  }

  return node
}

withParsing($pull, arg => [parseMatch(arg)] as const)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/
 */
export function $pullAll(node: BSONNode, blacklist: ArrayNode): BSONNode {
  if (node.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$pullAll found an element of non-array type (got ${node.kind})`,
    )
  }

  for (const value of blacklist.value) {
    let i = 0
    while (i < node.value.length) {
      if ($eq(node.value[i], value).value) {
        expected(node.raw).splice(i, 1)
        node.value.splice(i, 1)
      } else {
        i++
      }
    }
  }

  return node
}

withParsing<[ArrayNode]>($pullAll, arg => [
  assertBSON(arg, NodeKind.ARRAY, '$pullAll expectes an array'),
])

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/push/
 *
 * Update array to add elements in the correct position.
 * Apply sort, if specified.
 * Slice the array, if specified.
 * Store the array.
 */
export function $push(
  node: BSONNode,
  each: ArrayNode,
  position: DoubleNode,
  sort: BSONNode,
  slice: DoubleNode | NullishNode,
): BSONNode {
  if (node.kind === NodeKind.NULLISH) {
    return each
  }
  if (node.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$push found an element of non-array type (got ${node.kind})`,
    )
  }

  let i = position.value
  if (i < 0) {
    i = Math.max(0, node.value.length + i)
  }

  if (i >= node.value.length) {
    expected(node.raw).push(...each.value.map(unwrapBSON))
    node.value.push(...each.value)
  } else {
    expected(node.raw).splice(i, 0, ...each.value.map(unwrapBSON))
    node.value.splice(i, 0, ...each.value)
  }

  if (sort.kind !== NodeKind.NULLISH) {
    throw new Error('$sort modifier is not supported')
  }

  if (slice.kind !== NodeKind.NULLISH) {
    if (slice.value >= 0) {
      const n = node.value.length
      expected(node.raw).splice(slice.value, n)
      node.value.splice(slice.value, n)
    } else {
      const n = node.value.length + slice.value
      expected(node.raw).splice(0, n)
      node.value.splice(0, n)
    }
  }

  return node
}

withParsing($push, arg => {
  if (arg.kind === NodeKind.OBJECT && arg.keys.some(k => k[0] === '$')) {
    return [
      parseEach(arg.value.$each),
      parsePosition(arg.value.$position),
      parseSort(arg.value.$sort),
      parseSlice(arg.value.$slice),
    ] as const
  }

  return [
    wrapNodes([arg]),
    nDouble(Number.POSITIVE_INFINITY),
    nNullish(),
    nNullish(),
  ] as const
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/position/
 */
function parsePosition(arg: BSONNode = nNullish()): DoubleNode {
  if (arg.kind === NodeKind.NULLISH) {
    return nDouble(Number.POSITIVE_INFINITY)
  }
  const n = unwrapNumber(
    arg,
    `$position required a numeric value (got ${arg.kind})`,
  )
  if (Number.isNaN(n) || (Number.isFinite(n) && !Number.isInteger(n))) {
    throw new TypeError(`$position required a numeric value (got ${n})`)
  }
  return nDouble(n)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/each/
 */
function parseEach(arg: BSONNode = nNullish()): ArrayNode {
  if (arg.kind === NodeKind.NULLISH) {
    throw new TypeError('Expected $each modifier')
  }
  if (arg.kind !== NodeKind.ARRAY) {
    throw new TypeError(`$slice requires an integer (got ${arg.kind})`)
  }
  return arg
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/slice/
 */
function parseSlice(arg: BSONNode = nNullish()): DoubleNode | NullishNode {
  if (arg.kind === NodeKind.NULLISH) {
    return arg
  }
  const n = unwrapNumber(arg)
  if (!Number.isInteger(n)) {
    throw new TypeError(`$slice requires an integer (got ${n})`)
  }
  return nDouble(n)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/sort/
 */
function parseSort(arg: BSONNode = nNullish()): BSONNode {
  if (arg.kind !== NodeKind.NULLISH) {
    throw new Error('$sort modifier is not supported')
  }
  return arg
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
 */
export function $addToSet(left: BSONNode, right: ArrayNode): ArrayNode {
  if (left.kind === NodeKind.NULLISH) {
    return right
  }
  if (left.kind !== NodeKind.ARRAY) {
    throw new TypeError(
      `$addToSet found an element of non-array type (got ${left.kind})`,
    )
  }

  for (const r of right.value) {
    if (!left.value.some(l => $eq(l, r).value)) {
      expected(left.raw).push(unwrapBSON(r))
      left.value.push(r)
    }
  }

  return left
}

withParsing($addToSet, arg => {
  if (arg.kind === NodeKind.OBJECT && arg.keys.some(k => k[0] === '$')) {
    return [parseEach(arg.value.$each)] as const
  }
  return [wrapNodes([arg])] as const
})
