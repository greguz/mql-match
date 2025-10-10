import { Double, Long, ObjectId } from 'bson'

import { parseBSONType } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  type DateNode,
  type LongNode,
  NodeKind,
  type NullishNode,
  nBoolean,
  nDate,
  nDouble,
  nLong,
  nNullish,
  nString,
} from '../lib/node.js'
import { withParsing } from '../lib/operator.js'

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
    case NodeKind.INT:
      return nString('int')
    case NodeKind.DECIMAL:
      return nString('decimal')
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
    const nodeKind = parseBSONType(toType)
    switch (nodeKind) {
      case NodeKind.BOOLEAN:
        return $toBool(input)
      case NodeKind.OBJECT_ID:
        return $toObjectId(input)
      case NodeKind.DOUBLE:
        return $toDouble(input)
      case NodeKind.STRING:
        return $toString(input)
      case NodeKind.LONG:
        return $toLong(input)
      case NodeKind.DATE:
        return $toDate(input)
      default:
        throw new TypeError(`Unsupported $convert type: ${nodeKind}`)
    }
  } catch (err) {
    if (onError.kind === NodeKind.NULLISH) {
      throw err
    }
    return onError
  }
}

withParsing($convert, arg => {
  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError('$convert operator expects an object as argument')
  }
  if (!arg.value.input) {
    throw new TypeError("Missing 'input' parameter to $convert")
  }

  let toType: BSONNode = arg.value.to || nNullish()
  let toSubtype: BSONNode | undefined

  if (toType.kind === NodeKind.OBJECT) {
    toSubtype = toType.value.subtype
    toType = toType.value.type || nNullish()
  }

  // input, to.type, to.subtype, byteOrder, format, onError, onNull
  return [
    arg.value.input,
    toType,
    parseConvertSubtype(toSubtype),
    parseConvertByteOrder(arg.value.byteOrder),
    parseConvertFormat(arg.value.format),
    arg.value.onError || nNullish(),
    arg.value.onNull || nNullish(),
  ]
})

function parseConvertSubtype(node: BSONNode = nNullish()): BSONNode {
  if (node.kind === NodeKind.NULLISH) {
    return node
  }
  throw new TypeError('$convert.to.subtype is currently not supported')
}

function parseConvertByteOrder(node: BSONNode = nNullish()): BSONNode {
  if (node.kind === NodeKind.NULLISH) {
    return nString('little')
  }
  if (node.value === 'big' || node.value === 'little') {
    return node
  }
  throw new TypeError(`Unsupported $convert.byteOrder: ${node.value}`)
}

function parseConvertFormat(node: BSONNode = nNullish()): BSONNode {
  if (node.kind === NodeKind.NULLISH) {
    return node
  }

  switch (node.value) {
    case ConvertFormat.BASE64:
    case ConvertFormat.BASE64URL:
    case ConvertFormat.UTF8:
    case ConvertFormat.HEX:
    case ConvertFormat.UUID:
      return nString(node.value)
    default:
      throw new TypeError(`Unsupported $convert.format: ${node.value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/isNumber/
 */
export function $isNumber(arg: BSONNode): BSONNode {
  switch (arg.kind) {
    case NodeKind.DECIMAL:
    case NodeKind.DOUBLE:
    case NodeKind.INT:
    case NodeKind.LONG:
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
      return nBoolean(arg.value !== 0)

    case NodeKind.INT:
      return nBoolean(arg.value.value !== 0)

    case NodeKind.LONG:
      return nBoolean(!arg.value.isZero())

    case NodeKind.DECIMAL:
      return nBoolean(arg.value.toString() !== '0') // TODO: yes?
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/
 */
export function $toDouble(arg: BSONNode): BSONNode {
  switch (arg.kind) {
    case NodeKind.DOUBLE:
    case NodeKind.NULLISH:
      return arg
    case NodeKind.INT:
      return nDouble(arg.value.value)
    case NodeKind.BOOLEAN:
      return nDouble(arg.value ? 1 : 0)
    case NodeKind.DATE:
      return nDouble(arg.value.getTime())
    case NodeKind.STRING:
      return nDouble(Double.fromString(arg.value).value)
    default:
      throw new TypeError(`Unsupported double casting from ${arg.kind} type`)
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
  throw new TypeError(`Unsupported ObjectId casting from ${arg.kind} type`)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/
 */
export function $toString(arg: BSONNode): BSONNode {
  // TODO: binData
  switch (arg.kind) {
    case NodeKind.NULLISH:
    case NodeKind.STRING:
      return arg
    case NodeKind.BOOLEAN:
    case NodeKind.DOUBLE:
      return nString(`${arg.value}`)
    case NodeKind.INT:
      return nString(`${arg.value.value}`)
    case NodeKind.LONG:
      return nString(arg.value.toString())
    case NodeKind.OBJECT_ID:
      return nString(arg.value.toHexString())
    case NodeKind.DATE:
      return nString(arg.value.toISOString())
    default:
      throw new TypeError(`Unsupported string casting from ${arg.kind} type`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLong/
 */
export function $toLong(arg: BSONNode): LongNode | NullishNode {
  switch (arg.kind) {
    case NodeKind.LONG:
    case NodeKind.NULLISH:
      return arg
    case NodeKind.BOOLEAN:
      return nLong(arg.value ? 1 : 0)
    case NodeKind.STRING:
      return nLong(Long.fromString(arg.value))
    case NodeKind.DATE:
      return nLong(arg.value.getTime())
    case NodeKind.DOUBLE:
      return nLong(arg.value)
    default:
      throw new TypeError(`Unsupported long casting from ${arg.kind} type`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDate/
 */
export function $toDate(arg: BSONNode): DateNode | NullishNode {
  switch (arg.kind) {
    case NodeKind.DATE:
    case NodeKind.NULLISH:
      return arg
    case NodeKind.OBJECT_ID:
      return nDate(arg.value.getTimestamp())
    case NodeKind.TIMESTAMP:
      return nDate(new Date(arg.value.t * 1000))
    case NodeKind.STRING:
      return nDate(new Date(arg.value)) // TODO: validate
    case NodeKind.DOUBLE:
      return nDate(new Date(arg.value))
    case NodeKind.LONG:
      return nDate(new Date(arg.value.toNumber()))
    case NodeKind.INT:
      return nDate(new Date(arg.value.value))
    default:
      throw new TypeError(`Unsupported date casting from ${arg.kind} type`)
  }
}
