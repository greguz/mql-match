import {
  type Binary,
  type BSONRegExp,
  BSONType,
  type Decimal128,
  type Double,
  type Int32,
  type Long,
  type ObjectId,
  type Timestamp,
} from 'bson'

import {
  type ArrayNode,
  type BinaryNode,
  type BooleanNode,
  type BSONNode,
  type DateNode,
  type DecimalNode,
  type DoubleNode,
  type IntNode,
  type LongNode,
  NodeKind,
  type NullishNode,
  nBoolean,
  nDouble,
  nLong,
  nNullish,
  nString,
  type ObjectIdNode,
  type ObjectNode,
  type RegExpNode,
  type StringNode,
  type TimestampNode,
} from './node.js'
import {
  expected,
  isArray,
  isBinary,
  isDate,
  isPlainObject,
  isRegExp,
} from './util.js'

/**
 * Cast from string alias to `BSONType` enum.
 */
export function parseBSONType(node: BSONNode): BSONNode['kind'] {
  switch (node.value) {
    case BSONType.null:
    case BSONType.undefined:
    case 'null':
    case 'undefined':
      return NodeKind.NULLISH

    case BSONType.bool:
    case 'bool':
      return NodeKind.BOOLEAN

    case BSONType.double:
    case 'double':
      return NodeKind.DOUBLE

    case BSONType.string:
    case 'string':
      return NodeKind.STRING

    case BSONType.array:
    case 'array':
      return NodeKind.ARRAY

    case BSONType.binData:
    case 'binData':
      return NodeKind.BINARY

    case BSONType.object:
    case 'object':
      return NodeKind.OBJECT

    case BSONType.objectId:
    case 'objectId':
      return NodeKind.OBJECT_ID

    case BSONType.date:
    case 'date':
      return NodeKind.DATE

    case BSONType.regex:
    case 'regex':
      return NodeKind.REGEX

    case BSONType.timestamp:
    case 'timestamp':
      return NodeKind.TIMESTAMP

    case BSONType.long:
    case 'long':
      return NodeKind.LONG

    case BSONType.int:
    case 'int':
      return NodeKind.INT

    case BSONType.decimal:
    case 'decimal':
      return NodeKind.DECIMAL

    default:
      throw new TypeError(`Unsupported BSON type: ${node.value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order/
 */
export function getBSONTypeWeight(value: BSONNode['kind']): number {
  switch (value) {
    case NodeKind.NULLISH:
      return 2
    case NodeKind.DECIMAL:
    case NodeKind.DOUBLE:
    case NodeKind.INT:
    case NodeKind.LONG:
      return 3
    case NodeKind.STRING:
      return 4
    case NodeKind.OBJECT:
      return 5
    case NodeKind.ARRAY:
      return 6
    case NodeKind.BINARY:
      return 7
    case NodeKind.OBJECT_ID:
      return 8
    case NodeKind.BOOLEAN:
      return 9
    case NodeKind.DATE:
      return 10
    case NodeKind.TIMESTAMP:
      return 11
    case NodeKind.REGEX:
      return 12
    default:
      throw new TypeError(`Unsupported BSON type: ${value}`)
  }
}

/**
 * Parse literal values.
 */
export function wrapBSON(value?: unknown): BSONNode {
  switch (typeof value) {
    case 'bigint':
      return nLong(value)
    case 'boolean':
      return nBoolean(value)
    case 'function':
      throw new TypeError('Functions are not supported')
    case 'number':
      return nDouble(value)
    case 'object':
      return value === null ? nNullish() : wrapObject(value)
    case 'string':
      return nString(value)
    case 'symbol':
      throw new TypeError('Symbols are not supported')
    case 'undefined':
      return nNullish()
  }
}

function wrapObject(value: object): BSONNode {
  if (isPlainObject(value)) {
    const keys = Object.keys(value)

    const obj: Record<string, BSONNode> = {}
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = wrapBSON(value[keys[i]])
    }

    return {
      kind: NodeKind.OBJECT,
      keys,
      value: obj,
    }
  }

  if (isArray(value)) {
    return { kind: NodeKind.ARRAY, value: value.map(wrapBSON) }
  }
  if (isBinary(value)) {
    return { kind: NodeKind.BINARY, value }
  }
  if (isDate(value)) {
    return { kind: NodeKind.DATE, value }
  }
  if (isRegExp(value)) {
    return { kind: NodeKind.REGEX, value }
  }

  const bsonType = Object(value)._bsontype
  if (bsonType !== undefined) {
    switch (bsonType) {
      case 'Binary':
        return {
          kind: NodeKind.BINARY,
          value: (value as Binary).buffer,
        }
      case 'ObjectId':
        return {
          kind: NodeKind.OBJECT_ID,
          value: value as ObjectId,
        }
      case 'Timestamp':
        return {
          kind: NodeKind.TIMESTAMP,
          value: value as Timestamp,
        }
      case 'Int32':
        return {
          kind: NodeKind.INT,
          value: value as Int32,
        }
      case 'Double':
        return {
          kind: NodeKind.DOUBLE,
          value: (value as Double).value,
        }
      case 'Long':
        return {
          kind: NodeKind.LONG,
          value: value as Long,
        }
      case 'BSONRegExp': {
        const { pattern, options } = value as BSONRegExp
        return {
          kind: NodeKind.REGEX,
          value: new RegExp(pattern, options), // TODO: escape?
        }
      }
      case 'Decimal128':
        return {
          kind: NodeKind.DECIMAL,
          value: value as Decimal128,
        }
      default:
        throw new TypeError(`Unsupported BSON type: ${bsonType}`)
    }
  }

  throw new TypeError(`Unsupported expression: ${value}`)
}

/**
 *
 */
export function unwrapBSON(node: BSONNode): unknown {
  switch (node.kind) {
    case NodeKind.ARRAY:
      return node.value.map(unwrapBSON)
    case NodeKind.OBJECT: {
      const result: Record<string, unknown> = { ...node.value }
      for (let i = 0; i < node.keys.length; i++) {
        result[node.keys[i]] = unwrapBSON(expected(node.value[node.keys[i]]))
      }
      return result
    }
    default:
      return node.value
  }
}

/**
 * Prepare operator's arguments array.
 */
export function normalizeArguments(arg: BSONNode): BSONNode[] {
  switch (arg.kind) {
    case NodeKind.ARRAY:
      return arg.value
    case NodeKind.NULLISH:
      return []
    default:
      return [arg]
  }
}

export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.ARRAY,
  message?: string,
): ArrayNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.BINARY,
  message?: string,
): BinaryNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.BOOLEAN,
  message?: string,
): BooleanNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.DATE,
  message?: string,
): DateNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.DECIMAL,
  message?: string,
): DecimalNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.DOUBLE,
  message?: string,
): DoubleNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.INT,
  message?: string,
): IntNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.LONG,
  message?: string,
): LongNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.NULLISH,
  message?: string,
): NullishNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.OBJECT_ID,
  message?: string,
): ObjectIdNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.OBJECT,
  message?: string,
): ObjectNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.REGEX,
  message?: string,
): RegExpNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.STRING,
  message?: string,
): StringNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.TIMESTAMP,
  message?: string,
): TimestampNode
export function assertBSON(
  node: BSONNode,
  kind: BSONNode['kind'],
  message?: string,
): BSONNode {
  if (node.kind !== kind) {
    throw new TypeError(
      message || `Unexpected BSON type: ${node.kind} (expecting ${kind})`,
    )
  }
  return node
}
