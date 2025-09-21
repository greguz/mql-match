import { BSONType, type BSONValue } from 'bson'

/**
 * Detects BSON object instances.
 */
export function isBSON(value: unknown): value is BSONValue {
  return typeof Object(value)._bsontype === 'string'
}

/**
 * Cast from string alias to `BSONType` enum.
 */
export function parseBSONAlias(value: unknown): unknown {
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
export function getBSONTypeWeight(value: unknown): number {
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
