import { unwrapNumber } from '../lib/bson.js'
import { type BSONNode, NodeKind, nDouble } from '../lib/node.js'
import { withParsing } from '../lib/operator.js'
import { expected } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
 */
export function $addToSet(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $addToSet')
}

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
  return [nDouble(n)]
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pull/
 */
export function $pull(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $pull')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/push/
 */
export function $push(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $push')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/
 */
export function $pullAll(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $pullAll')
}
