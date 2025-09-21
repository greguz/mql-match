import type { BSONValue } from 'bson'

/**
 * Detects BSON object instances.
 */
export function isBSON(value: unknown): value is BSONValue {
  return typeof Object(value)._bsontype === 'string'
}

/**
 * https://www.mongodb.com/docs/manual/reference/bson-types/
 */
export const BSONType = Object.freeze({
  DOUBLE: 1,
  STRING: 2,
  OBJECT: 3,
  ARRAY: 4,
  BINARY: 5,
  /**
   * Alias for `BSONType.NULL`
   */
  UNDEFINED: 10,
  OBJECT_ID: 7,
  BOOLEAN: 8,
  DATE: 9,
  NULL: 10,
  REG_EXP: 11,
  DB_POINTER: 12,
  JAVASCRIPT: 13,
  SYMBOL: 14,
  JAVASCRIPT_WITH_SCOPE: 15,
  INT32: 16,
  TIMESTAMP: 17,
  LONG: 18,
  DECIMAL128: 19,
  MIN_KEY: -1,
  MAX_KEY: 127,
})

/**
 * Cast from string alias to `BSONType` enum.
 */
export function parseBSONAlias(value: unknown): unknown {
  switch (value) {
    case 'double':
      return BSONType.DOUBLE
    case 'string':
      return BSONType.STRING
    case 'object':
      return BSONType.OBJECT
    case 'array':
      return BSONType.ARRAY
    case 'binData':
      return BSONType.BINARY
    case 'undefined':
      return BSONType.NULL // same as 'null'
    case 'objectId':
      return BSONType.OBJECT_ID
    case 'bool':
      return BSONType.BOOLEAN
    case 'date':
      return BSONType.DATE
    case 'null':
      return BSONType.NULL
    case 'regex':
      return BSONType.REG_EXP
    case 'dbPointer':
      return BSONType.DB_POINTER
    case 'javascript':
      return BSONType.JAVASCRIPT
    case 'symbol':
      return BSONType.SYMBOL
    case 'int':
      return BSONType.INT32
    case 'timestamp':
      return BSONType.TIMESTAMP
    case 'long':
      return BSONType.LONG
    case 'decimal':
      return BSONType.DECIMAL128
    case 'minKey':
      return BSONType.MIN_KEY
    case 'maxKey':
      return BSONType.MAX_KEY
    default:
      return value
  }
}
