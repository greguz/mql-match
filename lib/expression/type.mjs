import { ObjectId } from 'bson'

import { BSON, getBSONType, getTypeAlias, n } from '../bson.mjs'
import { bind, isNullish, isPlainObject } from '../util.mjs'

export function $convert (args, compile, operator) {
  if (args.length !== 1) {
    throw new Error(`Expression ${operator} takes exactly 1 argument`)
  }

  const obj = args[0]
  if (!isPlainObject(obj)) {
    throw new TypeError(`Expression ${operator} expects an object`)
  }

  const read = compile(obj.input)
  const map = getConvertFn(obj.to)

  const onError = obj.onError ? compile(obj.onError) : null
  const onNull = obj.onNull ? compile(obj.onNull) : () => null

  return (doc, ctx) => {
    const value = read(doc, ctx)
    if (isNullish(value)) {
      return onNull(doc, ctx)
    }

    const type = getBSONType(value)
    if (!onError) {
      return map(value, type)
    }

    try {
      return map(value, type)
    } catch {
      return onError(doc, ctx)
    }
  }
}

function getConvertFn (type) {
  switch (type) {
    case 1:
    case 'double':
      return toDouble
    case 2:
    case 'string':
      return toString
    case 7:
    case 'objectId':
      return toObjectId
    case 8:
    case 'bool':
      return toBool
    // case 9:
    // case 'date':
    //   return
    // case 16:
    // case 'int':
    //   return
    // case 18:
    // case 'long':
    //   return
    default:
      throw new Error(`Unexpected conversion to ${type}`)
  }
}

function toDouble (value, type) {
  switch (type) {
    case BSON.Boolean:
      return value ? 1 : 0
    case BSON.Double:
      return value
    case BSON.Int32:
    case BSON.Long:
      return n(value)
    case BSON.String:
      // TODO: some validation?
      return parseFloat(value)
    default:
      throw new TypeError(
        `Unsupported conversion from ${getTypeAlias(type)} to double`
      )
  }
}

function toObjectId (value, type) {
  if (type === BSON.ObjectId) {
    return value
  } else if (type === BSON.String && ObjectId.isValid(value)) {
    return new ObjectId(value)
  } else {
    throw new TypeError(
      `Unsupported conversion from ${getTypeAlias(type)} to objectId`
    )
  }
}

function toString (value, type) {
  switch (type) {
    case BSON.Boolean:
      return value ? 'true' : 'false'
    case BSON.ObjectId:
      return value.toHexString()
    case BSON.String:
      return value
    case BSON.Date:
      return value.toISOString()
    case BSON.Double:
    case BSON.Decimal128:
    case BSON.Int32:
    case BSON.Long:
      return `${n(value)}`
    default:
      throw new TypeError(
        `Unsupported conversion from ${getTypeAlias(type)} to string`
      )
  }
}

function toBool (value, type) {
  switch (type) {
    case BSON.Boolean:
      return value
    case BSON.Double:
    case BSON.Int32:
    case BSON.Long:
      return n(value) !== 0
    case BSON.ObjectId:
    case BSON.String:
    case BSON.Date:
      return true
    default:
      throw new TypeError(
        `Unsupported conversion from ${getTypeAlias(type)} to boolean`
      )
  }
}

function isNumber (value, type) {
  switch (type) {
    case BSON.Decimal128:
    case BSON.Double:
    case BSON.Int32:
    case BSON.Long:
      return true
    default:
      return false
  }
}

function type (value, type) {
  return type === BSON.Undefined
    ? 'missing'
    : getTypeAlias(type)
}

function $operator (callback, args, compile, operator) {
  if (args.length !== 1) {
    throw new Error(`Expression ${operator} takes exactly 1 argument`)
  }
  const fn = compile(args[0])
  return (doc, ctx) => {
    const value = fn(doc, ctx)
    if (operator !== '$type' && isNullish(value)) {
      return null
    }
    const type = getBSONType(value)
    return callback(value, type)
  }
}

export const $isNumber = bind($operator, isNumber)
export const $toBool = bind($operator, toBool)
export const $toDouble = bind($operator, toDouble)
export const $toObjectId = bind($operator, toObjectId)
export const $toString = bind($operator, toString)
export const $type = bind($operator, type)
