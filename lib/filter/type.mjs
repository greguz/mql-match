import {
  isArray,
  isBoolean,
  isDate,
  isInteger,
  isNull,
  isNumber,
  isObjectId,
  isPlainObject,
  isRegExp,
  isString,
  isUndefined
} from '../util.mjs'

const types = {
  double: 1,
  string: 2,
  object: 3,
  array: 4,
  undefined: 6,
  objectId: 7,
  bool: 8,
  date: 9,
  null: 10,
  regex: 11,
  symbol: 14,
  int: 16,
  long: 18,
  decimal: 19
}

function resolve (type) {
  if (typeof type === 'number') {
    for (const key of Object.keys(types)) {
      if (types[key] === type) {
        return key
      }
    }
  }
  return type
}

export function $type (spec) {
  switch (resolve(spec)) {
    case 'decimal':
    case 'double':
      return isNumber
    case 'int':
    case 'long':
      return isInteger
    case 'string':
      return isString
    case 'object':
      return isPlainObject
    case 'array':
      return isArray
    case 'objectId':
      return isObjectId
    case 'bool':
      return isBoolean
    case 'date':
      return isDate
    case 'null':
      return isNull
    case 'regex':
      return isRegExp
    case 'undefined':
      return isUndefined
    default:
      throw new Error(`Unsupported type: ${spec}`)
  }
}
