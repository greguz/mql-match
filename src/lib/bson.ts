import {
  type Binary,
  BSONType,
  type Double,
  type Int32,
  type Long,
  type ObjectId,
  type Timestamp,
} from 'bson'

import {
  type BSONNode,
  NodeKind,
  nBoolean,
  nDouble,
  nLongNode,
  nNullish,
  nString,
} from './node.js'
import {
  isArray,
  isBinary,
  isDate,
  isNullish,
  isPlainObject,
  isRegExp,
} from './util.js'

/**
 * Cast from string alias to `BSONType` enum.
 */
export function castBSONAlias(value: unknown): unknown {
  switch (value) {
    case 'double':
      return BSONType.double
    case 'string':
      return BSONType.string
    case 'object':
      return BSONType.object
    case 'array':
      return BSONType.array
    case 'binData':
      return BSONType.binData
    case BSONType.undefined:
    case 'undefined':
      return BSONType.null // same as 'null'
    case 'objectId':
      return BSONType.objectId
    case 'bool':
      return BSONType.bool
    case 'date':
      return BSONType.date
    case 'null':
      return BSONType.null
    case 'regex':
      return BSONType.regex
    case 'dbPointer':
      return BSONType.dbPointer
    case 'javascript':
      return BSONType.javascript
    case 'symbol':
      return BSONType.symbol
    case 'int':
      return BSONType.int
    case 'timestamp':
      return BSONType.timestamp
    case 'long':
      return BSONType.long
    case 'decimal':
      return BSONType.decimal
    case 'minKey':
      return BSONType.minKey
    case 'maxKey':
      return BSONType.maxKey
    default:
      return value
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order/#std-label-bson-types-comparison-order
 */
export function getBSONTypeWeight(value: number): number {
  switch (value) {
    case BSONType.minKey:
      return 1
    case BSONType.null:
      return 2
    case BSONType.decimal:
    case BSONType.double:
    case BSONType.int:
    case BSONType.long:
      return 3
    case BSONType.string:
    case BSONType.symbol:
      return 4
    case BSONType.object:
      return 5
    case BSONType.array:
      return 6
    case BSONType.binData:
      return 7
    case BSONType.undefined:
      return 6
    case BSONType.objectId:
      return 8
    case BSONType.bool:
      return 9
    case BSONType.date:
      return 10
    case BSONType.timestamp:
      return 11
    case BSONType.regex:
      return 12
    case BSONType.javascript:
      return 13
    case BSONType.javascriptWithScope:
      return 14
    case BSONType.maxKey:
      return 15
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
      return nLongNode(value)
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
    return { kind: NodeKind.OBJECT, value }
  }

  if (isArray(value)) {
    return { kind: NodeKind.ARRAY, value }
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
          kind: NodeKind.DOUBLE,
          value: (value as Int32).value,
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
      default:
        throw new TypeError(`Unsupported BSON type: ${bsonType}`)
    }
  }

  throw new TypeError(`Unsupported expression: ${value}`)
}

/**
 * Prepare operator's arguments array.
 */
export function normalizeArguments(arg: unknown): BSONNode[] {
  if (isNullish(arg)) {
    return []
  }
  if (isArray(arg)) {
    return arg.map(wrapBSON)
  }
  return [wrapBSON(arg)]
}
