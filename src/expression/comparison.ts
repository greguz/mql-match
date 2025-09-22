import type { Long, Timestamp } from 'bson'

import { getBSONTypeWeight } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  type DoubleNode,
  NodeKind,
  nBoolean,
  nDouble,
} from '../lib/node.js'
import { withArguments } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/
 */
export function $cmp([left, right]: BSONNode[]): DoubleNode {
  const lw = getBSONTypeWeight(left.kind)
  const rw = getBSONTypeWeight(right.kind)
  if (lw !== rw) {
    return nDouble(left < right ? -1 : 1)
  }

  switch (left.kind) {
    case NodeKind.NULLISH:
      return nDouble(0)
    case NodeKind.BOOLEAN:
      return cmp(fromBoolean(left), fromBoolean(right))
    case NodeKind.STRING:
      return cmp(fromString(left), fromString(right))
    case NodeKind.DATE:
      return cmp(fromDate(left), fromDate(right))
    case NodeKind.OBJECT_ID:
      return cmp(fromObjectId(left), fromObjectId(right))
    case NodeKind.TIMESTAMP:
      return nDouble(left.value.compare(fromTimestamp(right)))
    case NodeKind.DOUBLE: {
      if (right.kind === NodeKind.DOUBLE) {
        return cmp(left.value, right.value)
      }
      if (right.kind === NodeKind.LONG) {
        return nDouble(-right.value.compare(left.value))
      }
      throw new TypeError('Expected numeric node')
    }
    case NodeKind.LONG:
      return nDouble(left.value.compare(fromNumber(right)))
    default:
      throw new TypeError(`Unsupported BSON type: ${left.kind}`)
  }
}

withArguments($cmp, 2)

function fromBoolean(node: BSONNode): number {
  if (node.kind !== NodeKind.BOOLEAN) {
    throw new TypeError('Expected boolean node')
  }
  return node.value ? 1 : 0
}

function fromDate(node: BSONNode): string {
  if (node.kind !== NodeKind.DATE) {
    throw new TypeError('Expected Date node')
  }
  return node.value.toISOString()
}

function fromNumber(node: BSONNode): number | Long {
  switch (node.kind) {
    case NodeKind.DOUBLE:
      return node.value
    case NodeKind.LONG:
      return node.value
    default:
      throw new TypeError('Expected numeric node')
  }
}

function fromObjectId(node: BSONNode): string {
  if (node.kind !== NodeKind.OBJECT_ID) {
    throw new TypeError('Expected ObjectId node')
  }
  return node.value.toHexString()
}

function fromString(node: BSONNode): string {
  if (node.kind !== NodeKind.STRING) {
    throw new TypeError('Expected string node')
  }
  return node.value
}

function fromTimestamp(node: BSONNode): Timestamp {
  if (node.kind !== NodeKind.TIMESTAMP) {
    throw new TypeError('Expected Timestamp node')
  }
  return node.value
}

function cmp<T extends number | string>(left: T, right: T) {
  return nDouble(left === right ? 0 : left < right ? -1 : 1)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/
 */
export function $eq(args: BSONNode[]): BooleanNode {
  return nBoolean($cmp(args).value === 0)
}

withArguments($eq, 2)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gt/
 */
export function $gt(args: BSONNode[]): BooleanNode {
  return nBoolean($cmp(args).value > 0)
}

withArguments($gt, 2)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lt/
 */
export function $lt(args: BSONNode[]): BooleanNode {
  return nBoolean($cmp(args).value < 0)
}

withArguments($lt, 2)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gte/
 */
export function $gte(args: BSONNode[]): BSONNode {
  return nBoolean($cmp(args).value >= 0)
}

withArguments($gte, 2)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lte/
 */
export function $lte(args: BSONNode[]): BSONNode {
  return nBoolean($cmp(args).value <= 0)
}

withArguments($lte, 2)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/
 */
export function $ne(args: BSONNode[]): BSONNode {
  return nBoolean($cmp(args).value !== 0)
}

withArguments($lte, 2)
