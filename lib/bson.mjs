import { Buffer } from 'buffer'

import {
  isArray,
  isBoolean,
  isDate,
  isNull,
  isPlainObject,
  isString,
  isUndefined
} from './util.mjs'

export const BSON = {
  Double: 1,
  String: 2,
  Object: 3,
  Array: 4,
  Binary: 5,
  Undefined: 6,
  ObjectId: 7,
  Boolean: 8,
  Date: 9,
  Null: 10,
  RegExp: 11,
  Reference: 12,
  JavaScript: 13,
  Symbol: 14,
  JavaScriptWithScope: 15,
  Int32: 16,
  Timestamp: 17,
  Long: 18,
  Decimal128: 19,
  MinKey: -1,
  MaxKey: 127
}

export function isJavaScript (value) {
  return typeof value === 'function' || Object(value)._bsontype === 'Code'
}

export function isReference (value) {
  return Object(value)._bsontype === 'DBRef'
}

export function isBinary (value) {
  return Buffer.isBuffer(value) || Object(value)._bsontype === 'Binary'
}

export function isObjectId (value) {
  return Object(value)._bsontype === 'ObjectID'
}

export function isRegExp (value) {
  return value instanceof RegExp || Object(value)._bsontype === 'BSONRegExp'
}

export function isSymbol (value) {
  return Object(value)._bsontype === 'Symbol'
}

export function isTimestamp (value) {
  return Object(value)._bsontype === 'Timestamp'
}

export function isMinKey (value) {
  return Object(value)._bsontype === 'MinKey'
}

export function isMaxKey (value) {
  return Object(value)._bsontype === 'MaxKey'
}

/**
 * Deletects falsy for MongoDB.
 * `NaN` is **not** falsy.
 */
export function isFalsy (value) {
  // TODO: other types?
  return isNumber(value)
    ? n(value) === 0
    : value === false || value === undefined || value === null
}

/**
 * Deletects truthy for MongoDB.
 * `NaN` is truthy.
 */
export function isTruthy (value) {
  return !isFalsy(value)
}

/**
 * 32 bit signed integer max number.
 */
const Int32Max = 2147483647

/**
 * 32 bit signed integer min number.
 */
const Int32Min = -2147483648

/**
 * Detects 32 bit signed integer.
 */
export function isInt32 (value) {
  return typeof value === 'bigint' || Number.isInteger(value)
    ? value <= Int32Max && value >= Int32Min
    : Object(value)._bsontype === 'Int32'
}

/**
 * Detects IEEE 754-2008 64 bit double-precision floating-point number.
 * Can be Infinity, NaN, -0, or "small" BigInt.
 */
export function isDouble (value) {
  return typeof value === 'bigint'
    ? value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER
    : typeof value === 'number' || Object(value)._bsontype === 'Double'
}

/**
 * Detects 64 bit signed integer.
 */
export function isLong (value) {
  // TODO: check BigInt limits
  return Number.isInteger(value) ||
    typeof value === 'bigint' ||
    Object(value)._bsontype === 'Long'
}

/**
 * Detects 128 bit signed decimal.
 */
export function isDecimal128 (value) {
  // TODO: check BigInt limits
  return Number.isFinite(value) ||
    typeof value === 'bigint' ||
    Object(value)._bsontype === 'Decimal128'
}

/**
 * BSON type code for numeric types.
 */
const numericTypes = [
  'Decimal128',
  'Double',
  'Int32',
  'Long'
]

/**
 * Detects numeric value.
 */
export function isNumber (value) {
  const type = Object(value)._bsontype
  return typeof type === 'string'
    ? numericTypes.includes(type)
    : typeof value === 'bigint' || typeof value === 'number'
}

/**
 * Returns the numeric representation of a value.
 */
export function n (value) {
  switch (Object(value)._bsontype) {
    case 'Decimal128':
      throw new Error('Decimal128 values are not supported')
    case 'Long':
      value = value.toBigInt()
      break
    case 'Double':
    case 'Int32':
      value = value.valueOf()
      break
  }

  if (
    typeof value === 'bigint' &&
    value <= Number.MAX_SAFE_INTEGER &&
    value >= Number.MIN_SAFE_INTEGER
  ) {
    value = parseInt(`${value}`)
  }

  return value
}

/**
 * Get the value's BSON type enum value.
 */
export function getBSONType (value) {
  if (isMinKey(value)) {
    return BSON.MinKey
  } else if (isMaxKey(value)) {
    return BSON.MaxKey
  } else if (isReference(value)) {
    return BSON.Reference
  } else if (isBoolean(value)) {
    return BSON.Boolean
  } else if (isString(value)) {
    return BSON.String
  } else if (isPlainObject(value)) {
    return BSON.Object
  } else if (isArray(value)) {
    return BSON.Array
  } else if (isBinary(value)) {
    return BSON.Binary
  } else if (isObjectId(value)) {
    return BSON.ObjectId
  } else if (isDate(value)) {
    return BSON.Date
  } else if (isUndefined(value)) {
    return BSON.Undefined
  } else if (isNull(value)) {
    return BSON.Null
  } else if (isRegExp(value)) {
    return BSON.RegExp
  } else if (isJavaScript(value)) {
    return BSON.JavaScript
  } else if (isSymbol(value)) {
    return BSON.Symbol
  } else if (isTimestamp(value)) {
    return BSON.Timestamp
  } else if (isInt32(value)) {
    return BSON.Int32
  } else if (isLong(value)) {
    return BSON.Long
  } else if (isDouble(value)) {
    return BSON.Double
  } else if (isDecimal128(value)) {
    return BSON.Decimal128
  } else {
    return null
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order/
 */
export function getTypeWeight (type) {
  switch (type) {
    case BSON.MinKey: // Always first
      return 1
    case BSON.Null:
    case BSON.Undefined:
      return 2
    case BSON.Decimal128:
    case BSON.Double:
    case BSON.Int32:
    case BSON.Long:
      return 3
    case BSON.String:
    case BSON.Symbol:
      return 4
    case BSON.Object:
      return 5
    case BSON.Array:
      return 6
    case BSON.Binary:
      return 7
    case BSON.ObjectId:
      return 8
    case BSON.Boolean:
      return 9
    case BSON.Date:
      return 10
    case BSON.Timestamp:
      return 11
    case BSON.RegExp:
      return 12
    case BSON.MaxKey: // Always last
      return 14
    default:
      return 13
  }
}
