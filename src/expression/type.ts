import { Double, ObjectId } from 'bson'

import { castBSONAlias } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  type DoubleNode,
  NodeKind,
  type NullishNode,
  nBoolean,
  nDouble,
  nExpression,
  nNullish,
  nString,
} from '../lib/node.js'
import { withParsing } from '../lib/operator.js'
import { isNullish, isObjectLike } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/
 */
export function $type(arg: BSONNode): BSONNode {
  switch (arg.kind) {
    case NodeKind.ARRAY:
      return nString('array')
    case NodeKind.BOOLEAN:
      return nString('bool')
    case NodeKind.DATE:
      return nString('date')
    case NodeKind.BINARY:
      return nString('binData')
    case NodeKind.LONG:
      return nString('long')
    case NodeKind.NULLISH:
      return nString('null')
    case NodeKind.DOUBLE:
      return nString('double')
    case NodeKind.OBJECT_ID:
      return nString('objectId')
    case NodeKind.REGEX:
      return nString('regex')
    case NodeKind.STRING:
      return nString('string')
    case NodeKind.TIMESTAMP:
      return nString('timestamp')
    case NodeKind.OBJECT:
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
  input: BSONNode,
  toType: BSONNode,
  toSubtype: BSONNode,
  byteOrder: BSONNode,
  format: BSONNode,
  onError: BSONNode,
  onNullish: BSONNode,
): BSONNode {
  if (input.kind === NodeKind.NULLISH) {
    return onNullish
  }

  try {
    switch (castBSONAlias(toType.value)) {
      case NodeKind.BOOLEAN:
        return $toBool(input)
      case NodeKind.OBJECT_ID:
        return $toObjectId(input)
      default:
        throw new TypeError(
          `$convert.to.type=${toType.value} is currently not supported`,
        )
    }
  } catch (err) {
    if (onError.kind === NodeKind.NULLISH) {
      throw err
    }
    return onError
  }
}

withParsing($convert, ([arg]) => {
  if (arg.kind !== NodeKind.OBJECT) {
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

function parseConvertSubtype(value: unknown): BSONNode {
  if (isNullish(value)) {
    return nNullish()
  }
  throw new TypeError('$convert.to.subtype is currently not supported')
}

function parseConvertByteOrder(value: unknown): BSONNode {
  if (isNullish(value)) {
    return nString('little')
  }
  if (value === 'big' || value === 'little') {
    return nString(value)
  }
  throw new TypeError(`Unsupported $convert.byteOrder: ${value}`)
}

function parseConvertFormat(value: unknown): BSONNode {
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
export function $isNumber(arg: BSONNode): BSONNode {
  switch (arg.kind) {
    case NodeKind.LONG:
    case NodeKind.DOUBLE:
      return nBoolean(true)
    default:
      return nBoolean(false)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/
 */
export function $toBool(arg: BSONNode): BooleanNode | NullishNode {
  switch (arg.kind) {
    case NodeKind.BOOLEAN:
    case NodeKind.NULLISH:
      return arg

    case NodeKind.ARRAY:
    case NodeKind.BINARY:
    case NodeKind.DATE:
    case NodeKind.OBJECT:
    case NodeKind.OBJECT_ID:
    case NodeKind.REGEX:
    case NodeKind.STRING:
    case NodeKind.TIMESTAMP:
      return nBoolean(true)

    case NodeKind.DOUBLE:
    case NodeKind.LONG:
      return nBoolean(arg.value !== 0)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/
 */
export function $toDouble(arg: BSONNode): DoubleNode {
  switch (arg.kind) {
    case NodeKind.DOUBLE:
      return arg
    case NodeKind.BOOLEAN:
      return nDouble(arg.value ? 1 : 0)
    case NodeKind.DATE:
      return nDouble(arg.value.getTime())
    case NodeKind.STRING:
      return nDouble(Double.fromString(arg.value).value)
    default:
      throw new TypeError(`Unsupported conversion to double: ${arg.value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/
 */
export function $toObjectId(arg: BSONNode): BSONNode {
  if (arg.kind === NodeKind.OBJECT_ID) {
    return arg
  }
  if (arg.kind === NodeKind.STRING && ObjectId.isValid(arg.value)) {
    return { kind: NodeKind.OBJECT_ID, value: new ObjectId(arg.value) }
  }
  throw new TypeError(`Cannot cast to ObjectId: ${arg.value}`)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/
 */
export function $toString(arg: BSONNode): BSONNode {
  // TODO: binData
  switch (arg.kind) {
    case NodeKind.BOOLEAN:
    case NodeKind.DOUBLE:
    case NodeKind.LONG:
      return nString(`${arg.value}`)
    case NodeKind.OBJECT_ID:
      return nString(arg.value.toHexString())
    case NodeKind.DATE:
      return nString(arg.value.toISOString())
    default:
      throw new TypeError(`Unsupported string casting: ${arg.value}`)
  }
}
