import { ObjectId } from 'bson'

import { BSONType, parseBSONAlias } from '../bson.js'
import {
  nBoolean,
  nExpression,
  nNullish,
  nNumber,
  nString,
  type ValueNode,
  withParsing,
} from '../node.js'
import { isNullish, isObjectLike } from '../util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/
 */
export function $type(arg: ValueNode): ValueNode {
  switch (arg.kind) {
    case 'ARRAY':
      return nString('array')
    case 'BOOLEAN':
      return nString('bool')
    case 'DATE':
      return nString('date')
    case 'BINARY':
      return nString('binData')
    case 'BIG_INT':
      return nString('long')
    case 'NULLISH':
      return nString('null')
    case 'NUMBER':
      return nString('double')
    case 'OBJECT_ID':
      return nString('objectId')
    case 'REG_EXP':
      return nString('regex')
    case 'STRING':
      return nString('string')
    case 'TIMESTAMP':
      return nString('timestamp')
    case 'OBJECT':
      return nString('object')
  }
}

const ConvertFormat = Object.freeze({
  BASE64: 'base64',
  BASE64URL: 'base64url',
  UTF8: 'utf8',
  HEX: 'hex',
  UUID: 'uuid',
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/convert/
 */
export function $convert(
  input: ValueNode,
  toType: ValueNode,
  toSubtype: ValueNode,
  byteOrder: ValueNode,
  format: ValueNode,
  onError: ValueNode,
  onNullish: ValueNode,
): ValueNode {
  if (input.kind === 'NULLISH') {
    return onNullish
  }

  try {
    switch (parseBSONAlias(toType.value)) {
      case BSONType.BOOLEAN:
        return $toBool(input)
      case BSONType.OBJECT_ID:
        return $toObjectId(input)
      default:
        throw new TypeError(
          `$convert.to.type=${toType.value} is currently not supported`,
        )
    }
  } catch (err) {
    if (onError.kind === 'NULLISH') {
      throw err
    }
    return onError
  }
}

withParsing($convert, arg => {
  if (arg.kind !== 'OBJECT') {
    throw new TypeError('$convert operator expects an object as argument')
  }
  const obj = arg.value

  let toType: unknown
  let toSubtype: unknown
  if (isObjectLike(obj.to)) {
    toType = obj.to.type
    toSubtype = obj.to.subtype
  } else {
    toType = obj.to
  }

  // input, to.type, to.subtype, byteOrder, format, onError, onNull
  return [
    nExpression(obj.input),
    nExpression(toType),
    parseConvertSubtype(toSubtype),
    parseConvertByteOrder(obj.byteOrder),
    parseConvertFormat(obj.format),
    nExpression(obj.onError),
    nExpression(obj.onNull),
  ]
})

function parseConvertSubtype(value: unknown): ValueNode {
  if (isNullish(value)) {
    return nNullish()
  }
  throw new TypeError('$convert.to.subtype is currently not supported')
}

function parseConvertByteOrder(value: unknown): ValueNode {
  if (isNullish(value)) {
    return nString('little')
  }
  if (value === 'big' || value === 'little') {
    return nString(value)
  }
  throw new TypeError(`Unsupported $convert.byteOrder: ${value}`)
}

function parseConvertFormat(value: unknown): ValueNode {
  if (isNullish(value)) {
    return nNullish()
  }

  switch (value) {
    case ConvertFormat.BASE64:
    case ConvertFormat.BASE64URL:
    case ConvertFormat.UTF8:
    case ConvertFormat.HEX:
    case ConvertFormat.UUID:
      return nString(value as string) // TODO: why TS fails here?
    default:
      throw new TypeError(`Unsupported $convert.format: ${value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/isNumber/
 */
export function $isNumber(arg: ValueNode): ValueNode {
  switch (arg.kind) {
    case 'BIG_INT':
    case 'NUMBER':
      return nBoolean(true)
    default:
      return nBoolean(false)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/
 */
export function $toBool(arg: ValueNode): ValueNode {
  switch (arg.kind) {
    case 'BOOLEAN':
    case 'NULLISH':
      return arg

    case 'ARRAY':
    case 'BINARY':
    case 'DATE':
    case 'OBJECT_ID':
    case 'OBJECT':
    case 'REG_EXP':
    case 'STRING':
    case 'TIMESTAMP':
      return nBoolean(true)

    case 'BIG_INT':
    case 'NUMBER':
      return nBoolean(arg.value !== 0)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/
 */
export function $toDouble(arg: ValueNode): ValueNode {
  switch (arg.kind) {
    case 'NUMBER':
      return arg
    case 'BOOLEAN':
      return nNumber(arg.value ? 1 : 0)
    case 'DATE':
      return nNumber(arg.value.getTime())
    case 'STRING':
      return nNumber(Number.parseFloat(arg.value)) // TODO: fix?
    default:
      throw new TypeError(`Unsupported conversion to double: ${arg.value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/
 */
export function $toObjectId(arg: ValueNode): ValueNode {
  if (arg.kind === 'OBJECT_ID') {
    return arg
  }
  if (arg.kind === 'STRING' && ObjectId.isValid(arg.value)) {
    return { kind: 'OBJECT_ID', value: new ObjectId(arg.value) }
  }
  throw new TypeError(`Cannot cast to ObjectId: ${arg.value}`)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/
 */
export function $toString(arg: ValueNode): ValueNode {
  // TODO: binData
  switch (arg.kind) {
    case 'BIG_INT':
    case 'BOOLEAN':
    case 'NUMBER':
      return nString(`${arg.value}`)
    case 'OBJECT_ID':
      return nString(arg.value.toHexString())
    case 'DATE':
      return nString(arg.value.toISOString())
    default:
      throw new TypeError(`Unsupported string casting: ${arg.value}`)
  }
}
