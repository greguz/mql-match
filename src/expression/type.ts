import { BSONType, ObjectId } from 'bson'

import { parseBSONAlias } from '../bson.js'
import {
  type BooleanNode,
  type DoubleNode,
  type NullishNode,
  nBoolean,
  nDouble,
  nExpression,
  nNullish,
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
    case BSONType.array:
      return nString('array')
    case BSONType.bool:
      return nString('bool')
    case BSONType.date:
      return nString('date')
    case BSONType.binData:
      return nString('binData')
    case BSONType.long:
      return nString('long')
    case BSONType.null:
      return nString('null')
    case BSONType.double:
      return nString('double')
    case BSONType.objectId:
      return nString('objectId')
    case BSONType.regex:
      return nString('regex')
    case BSONType.string:
      return nString('string')
    case BSONType.timestamp:
      return nString('timestamp')
    case BSONType.object:
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
  if (input.kind === BSONType.null) {
    return onNullish
  }

  try {
    switch (parseBSONAlias(toType.value)) {
      case BSONType.bool:
        return $toBool(input)
      case BSONType.objectId:
        return $toObjectId(input)
      default:
        throw new TypeError(
          `$convert.to.type=${toType.value} is currently not supported`,
        )
    }
  } catch (err) {
    if (onError.kind === BSONType.null) {
      throw err
    }
    return onError
  }
}

withParsing($convert, arg => {
  if (arg.kind !== BSONType.object) {
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
    case BSONType.long:
    case BSONType.double:
      return nBoolean(true)
    default:
      return nBoolean(false)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/
 */
export function $toBool(arg: ValueNode): BooleanNode | NullishNode {
  switch (arg.kind) {
    case BSONType.bool:
    case BSONType.null:
      return arg

    case BSONType.array:
    case BSONType.binData:
    case BSONType.date:
    case BSONType.object:
    case BSONType.objectId:
    case BSONType.regex:
    case BSONType.string:
    case BSONType.timestamp:
      return nBoolean(true)

    case BSONType.double:
    case BSONType.long:
      return nBoolean(arg.value !== 0)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/
 */
export function $toDouble(arg: ValueNode): DoubleNode {
  switch (arg.kind) {
    case BSONType.double:
      return arg
    case BSONType.bool:
      return nDouble(arg.value ? 1 : 0)
    case BSONType.date:
      return nDouble(arg.value.getTime())
    case BSONType.string:
      return nDouble(Number.parseFloat(arg.value)) // TODO: fix?
    default:
      throw new TypeError(`Unsupported conversion to double: ${arg.value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/
 */
export function $toObjectId(arg: ValueNode): ValueNode {
  if (arg.kind === BSONType.objectId) {
    return arg
  }
  if (arg.kind === BSONType.string && ObjectId.isValid(arg.value)) {
    return { kind: BSONType.objectId, value: new ObjectId(arg.value) }
  }
  throw new TypeError(`Cannot cast to ObjectId: ${arg.value}`)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/
 */
export function $toString(arg: ValueNode): ValueNode {
  // TODO: binData
  switch (arg.kind) {
    case BSONType.bool:
    case BSONType.double:
    case BSONType.long:
      return nString(`${arg.value}`)
    case BSONType.objectId:
      return nString(arg.value.toHexString())
    case BSONType.date:
      return nString(arg.value.toISOString())
    default:
      throw new TypeError(`Unsupported string casting: ${arg.value}`)
  }
}
