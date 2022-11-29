import {
  BSON,
  isBinary,
  isDecimal128,
  isDouble,
  isInt32,
  isJavaScript,
  isLong,
  isMaxKey,
  isMinKey,
  isNumber,
  isObjectId,
  isRegExp,
  isSymbol,
  isTimestamp
} from '../bson.mjs'
import {
  isArray,
  isBoolean,
  isDate,
  isNull,
  isPlainObject,
  isString,
  isUndefined
} from '../util.mjs'
import { $or } from './logic.mjs'

export function $type (spec) {
  return isArray(spec)
    ? $or(spec.map(compileType))
    : compileType(spec)
}

function compileType (value) {
  switch (value) {
    case BSON.Double:
    case 'double':
      return isDouble
    case BSON.String:
    case 'string':
      return isString
    case BSON.Object:
    case 'object':
      return isPlainObject
    case BSON.Array:
    case 'array':
      return isArray
    case BSON.Binary:
    case 'binData':
      return isBinary
    case BSON.Undefined:
    case 'undefined':
      return isUndefined
    case BSON.ObjectId:
    case 'objectId':
      return isObjectId
    case BSON.Boolean:
    case 'bool':
      return isBoolean
    case BSON.Date:
    case 'date':
      return isDate
    case BSON.Null:
    case 'null':
      return isNull
    case BSON.RegExp:
    case 'regex':
      return isRegExp
    case BSON.Symbol:
    case 'symbol':
      return isSymbol
    case BSON.Int32:
    case 'int':
      return isInt32
    case BSON.Timestamp:
    case 'timestamp':
      return isTimestamp
    case BSON.Long:
    case 'long':
      return isLong
    case BSON.Decimal128:
    case 'decimal':
      return isDecimal128
    case BSON.MinKey:
    case 'minKey':
      return isMinKey
    case BSON.MaxKey:
    case 'maxKey':
      return isMaxKey
    case 'number':
      return isNumber
    case BSON.JavaScript:
    case 'javascript':
      return isJavaScript
    default:
      throw new Error(`Unsupported type: ${value}`)
  }
}
