import type { Timestamp } from 'bson'

import { assertBSON, getBSONTypeWeight } from '../lib/bson.js'
import {
  type ArrayNode,
  type BooleanNode,
  type BSONNode,
  type DoubleNode,
  type IntNode,
  type LongNode,
  NodeKind,
  nBoolean,
  nDouble,
  nNullish,
  type ObjectNode,
} from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/
 */
export function $cmp(left: BSONNode, right: BSONNode): DoubleNode {
  const lw = getBSONTypeWeight(left.kind)
  const rw = getBSONTypeWeight(right.kind)
  if (lw !== rw) {
    return nDouble(left < right ? -1 : 1)
  }

  switch (left.kind) {
    case NodeKind.NULLISH:
      return nDouble(0)
    case NodeKind.BOOLEAN:
      return compareRaw(mapBoolean(left), mapBoolean(right))
    case NodeKind.STRING:
      return compareRaw(mapString(left), mapString(right))
    case NodeKind.DATE:
      return compareRaw(mapDate(left), mapDate(right))
    case NodeKind.OBJECT_ID:
      return compareRaw(mapObjectId(left), mapObjectId(right))
    case NodeKind.TIMESTAMP:
      return nDouble(left.value.compare(mapTimestamp(right)))
    case NodeKind.DOUBLE:
      return compareDouble(left, right)
    case NodeKind.LONG:
      return compareLong(left, right)
    case NodeKind.INT:
      return compareInt(left, right)
    case NodeKind.ARRAY:
      return compareArrays(left, assertBSON(right, NodeKind.ARRAY))
    case NodeKind.OBJECT:
      return compareObjects(left, assertBSON(right, NodeKind.OBJECT))
    default:
      throw new TypeError(`Unsupported BSON type comparison: ${left.kind}`)
  }
}

function compareInt(left: IntNode, right: BSONNode): DoubleNode {
  switch (right.kind) {
    case NodeKind.DOUBLE:
      return compareRaw(left.value.value, right.value)
    case NodeKind.INT:
      return compareRaw(left.value.value, right.value.value)
    case NodeKind.LONG:
      return nDouble(-right.value.compare(left.value.value))
    default:
      throw new TypeError(`Unsupported comparison for ${right.kind} type`)
  }
}

function compareDouble(left: DoubleNode, right: BSONNode) {
  switch (right.kind) {
    case NodeKind.DOUBLE:
      return compareRaw(left.value, right.value)
    case NodeKind.INT:
      return compareRaw(left.value, right.value.value)
    case NodeKind.LONG:
      return nDouble(-right.value.compare(left.value))
    default:
      throw new TypeError(`Unsupported comparison for ${right.kind} type`)
  }
}

function compareLong(left: LongNode, right: BSONNode) {
  switch (right.kind) {
    case NodeKind.INT:
      return nDouble(left.value.compare(right.value.value))
    case NodeKind.DOUBLE:
    case NodeKind.LONG:
      return nDouble(left.value.compare(right.value))
    default:
      throw new TypeError(`Unsupported comparison for ${right.kind} type`)
  }
}

function mapBoolean(node: BSONNode): number {
  return assertBSON(node, NodeKind.BOOLEAN) ? 1 : 0
}

function mapDate(node: BSONNode): string {
  return assertBSON(node, NodeKind.DATE).value.toISOString()
}

function mapObjectId(node: BSONNode): string {
  return assertBSON(node, NodeKind.OBJECT_ID).value.toHexString()
}

function mapString(node: BSONNode): string {
  return assertBSON(node, NodeKind.STRING).value
}

function mapTimestamp(node: BSONNode): Timestamp {
  return assertBSON(node, NodeKind.TIMESTAMP).value
}

function compareRaw<T extends number | string>(left: T, right: T) {
  return nDouble(left === right ? 0 : left < right ? -1 : 1)
}

function compareArrays(left: ArrayNode, right: ArrayNode): DoubleNode {
  for (let i = 0; i < Math.min(left.value.length, right.value.length); i++) {
    const result = $cmp(left.value[i], right.value[i])
    if (result.value !== 0) {
      return result
    }
  }
  return compareRaw(left.value.length, right.value.length)
}

function compareObjects(left: ObjectNode, right: ObjectNode): DoubleNode {
  // TODO: check this thing...
  const keys = [...left.keys]
  for (const key of right.keys) {
    if (!keys.includes(key)) {
      keys.push(key)
    }
  }
  keys.sort()

  for (const key of keys) {
    const result = $cmp(
      left.value[key] || nNullish(),
      right.value[key] || nNullish(),
    )
    if (result.value !== 0) {
      return result
    }
  }

  // TODO: incorrect (different keys)
  return nDouble(0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/
 */
export function $eq(left: BSONNode, right: BSONNode): BooleanNode {
  return nBoolean($cmp(left, right).value === 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gt/
 */
export function $gt(left: BSONNode, right: BSONNode): BooleanNode {
  return nBoolean($cmp(left, right).value > 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lt/
 */
export function $lt(left: BSONNode, right: BSONNode): BooleanNode {
  return nBoolean($cmp(left, right).value < 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gte/
 */
export function $gte(left: BSONNode, right: BSONNode): BSONNode {
  return nBoolean($cmp(left, right).value >= 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lte/
 */
export function $lte(left: BSONNode, right: BSONNode): BSONNode {
  return nBoolean($cmp(left, right).value <= 0)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/
 */
export function $ne(left: BSONNode, right: BSONNode): BSONNode {
  return nBoolean($cmp(left, right).value !== 0)
}
