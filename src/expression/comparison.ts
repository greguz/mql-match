import { BSONType, type Long, type Timestamp } from 'bson'

import { getBSONTypeWeight } from '../bson.js'
import {
  type BooleanNode,
  type DoubleNode,
  nBoolean,
  nDouble,
  type ValueNode,
} from '../node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/
 */
export function $cmp(left: ValueNode, right: ValueNode): DoubleNode {
  const lw = getBSONTypeWeight(left.kind)
  const rw = getBSONTypeWeight(right.kind)
  if (lw !== rw) {
    return nDouble(left < right ? -1 : 1)
  }

  switch (left.kind) {
    case BSONType.null:
      return nDouble(0)
    case BSONType.bool:
      return cmp(fromBoolean(left), fromBoolean(right))
    case BSONType.string:
      return cmp(fromString(left), fromString(right))
    case BSONType.date:
      return cmp(fromDate(left), fromDate(right))
    case BSONType.objectId:
      return cmp(fromObjectId(left), fromObjectId(right))
    case BSONType.timestamp:
      return nDouble(left.value.compare(fromTimestamp(right)))
    case BSONType.double: {
      if (right.kind === BSONType.double) {
        return cmp(left.value, right.value)
      }
      if (right.kind === BSONType.long) {
        return nDouble(-right.value.compare(left.value))
      }
      throw new TypeError('Expected numeric node')
    }
    case BSONType.long:
      return nDouble(left.value.compare(fromNumber(right)))
    default:
      throw new TypeError(`Unsupported BSON type: ${left.kind}`)
  }
}

function fromBoolean(node: ValueNode): number {
  if (node.kind !== BSONType.bool) {
    throw new TypeError('Expected boolean node')
  }
  return node.value ? 1 : 0
}

function fromDate(node: ValueNode): string {
  if (node.kind !== BSONType.date) {
    throw new TypeError('Expected Date node')
  }
  return node.value.toISOString()
}

function fromNumber(node: ValueNode): number | Long {
  switch (node.kind) {
    case BSONType.double:
      return node.value
    case BSONType.long:
      return node.value
    default:
      throw new TypeError('Expected numeric node')
  }
}

function fromObjectId(node: ValueNode): string {
  if (node.kind !== BSONType.objectId) {
    throw new TypeError('Expected ObjectId node')
  }
  return node.value.toHexString()
}

function fromString(node: ValueNode): string {
  if (node.kind !== BSONType.string) {
    throw new TypeError('Expected string node')
  }
  return node.value
}

function fromTimestamp(node: ValueNode): Timestamp {
  if (node.kind !== BSONType.timestamp) {
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
export function $eq(left: ValueNode, right: ValueNode): BooleanNode {
  return nBoolean($cmp(left, right).value === 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gt/
 */
export function $gt(left: ValueNode, right: ValueNode): BooleanNode {
  return nBoolean($cmp(left, right).value > 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lt/
 */
export function $lt(left: ValueNode, right: ValueNode): BooleanNode {
  return nBoolean($cmp(left, right).value < 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gte/
 */
export function $gte(left: ValueNode, right: ValueNode): ValueNode {
  return nBoolean($cmp(left, right).value >= 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lte/
 */
export function $lte(left: ValueNode, right: ValueNode): ValueNode {
  return nBoolean($cmp(left, right).value <= 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/
 */
export function $ne(left: ValueNode, right: ValueNode): ValueNode {
  return nBoolean($cmp(left, right).value !== 0)
}
