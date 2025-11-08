import {
  type Binary,
  type BSONRegExp,
  BSONType,
  type Decimal128,
  type Double,
  type Int32,
  type Long,
  type ObjectId,
  type Timestamp,
} from 'bson'
import { Decimal } from 'decimal.js'

import {
  type ArrayNode,
  type BinaryNode,
  type BooleanNode,
  type BSONNode,
  type DateNode,
  type DecimalNode,
  type DoubleNode,
  type IntNode,
  type LongNode,
  NodeKind,
  type NullishNode,
  nBoolean,
  nDouble,
  nLong,
  nNullish,
  nString,
  type ObjectIdNode,
  type ObjectNode,
  type RegexNode,
  type StringNode,
  type TimestampNode,
} from './node.js'
import {
  expected,
  includes,
  isArray,
  isBinary,
  isDate,
  isPlainObject,
  isRegExp,
} from './util.js'

/**
 * Cast from string alias to `BSONType` enum.
 */
export function parseBSONType(node: BSONNode): BSONNode['kind'] {
  switch (node.value) {
    case BSONType.null:
    case BSONType.undefined:
    case 'null':
    case 'undefined':
      return NodeKind.NULLISH

    case BSONType.bool:
    case 'bool':
      return NodeKind.BOOLEAN

    case BSONType.double:
    case 'double':
      return NodeKind.DOUBLE

    case BSONType.string:
    case 'string':
      return NodeKind.STRING

    case BSONType.array:
    case 'array':
      return NodeKind.ARRAY

    case BSONType.binData:
    case 'binData':
      return NodeKind.BINARY

    case BSONType.object:
    case 'object':
      return NodeKind.OBJECT

    case BSONType.objectId:
    case 'objectId':
      return NodeKind.OBJECT_ID

    case BSONType.date:
    case 'date':
      return NodeKind.DATE

    case BSONType.regex:
    case 'regex':
      return NodeKind.REGEX

    case BSONType.timestamp:
    case 'timestamp':
      return NodeKind.TIMESTAMP

    case BSONType.long:
    case 'long':
      return NodeKind.LONG

    case BSONType.int:
    case 'int':
      return NodeKind.INT

    case BSONType.decimal:
    case 'decimal':
      return NodeKind.DECIMAL

    default:
      throw new TypeError(`Unsupported BSON type: ${node.value}`)
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order/
 */
export function getBSONTypeWeight(value: BSONNode['kind']): number {
  switch (value) {
    case NodeKind.NULLISH:
      return 2
    case NodeKind.DECIMAL:
    case NodeKind.DOUBLE:
    case NodeKind.INT:
    case NodeKind.LONG:
      return 3
    case NodeKind.STRING:
      return 4
    case NodeKind.OBJECT:
      return 5
    case NodeKind.ARRAY:
      return 6
    case NodeKind.BINARY:
      return 7
    case NodeKind.OBJECT_ID:
      return 8
    case NodeKind.BOOLEAN:
      return 9
    case NodeKind.DATE:
      return 10
    case NodeKind.TIMESTAMP:
      return 11
    case NodeKind.REGEX:
      return 12
    default:
      throw new TypeError(`Unsupported BSON type: ${value}`)
  }
}

/**
 * Parse literal values.
 */
export function wrapBSON(value?: unknown): BSONNode {
  switch (typeof value) {
    case 'bigint':
      return nLong(value)
    case 'boolean':
      return nBoolean(value)
    case 'function':
      throw new TypeError('Functions are not supported')
    case 'number':
      return nDouble(value)
    case 'object':
      return value === null ? nNullish() : parseObject(value)
    case 'string':
      return nString(value)
    case 'symbol':
      throw new TypeError('Symbols are not supported')
    case 'undefined':
      return nNullish()
  }
}

function parseObject(value: object): BSONNode {
  if (isPlainObject(value)) {
    return wrapObjectRaw(value)
  }
  if (isArray(value)) {
    return wrapArrayRaw(value)
  }
  if (isBinary(value)) {
    return { kind: NodeKind.BINARY, value }
  }
  if (isDate(value)) {
    return { kind: NodeKind.DATE, value }
  }
  if (isRegExp(value)) {
    return { kind: NodeKind.REGEX, value }
  }

  const bsonType = Object(value)._bsontype
  if (bsonType !== undefined) {
    switch (bsonType) {
      case 'Binary':
        return {
          kind: NodeKind.BINARY,
          value: (value as Binary).buffer,
        }
      case 'ObjectId':
        return {
          kind: NodeKind.OBJECT_ID,
          value: value as ObjectId,
        }
      case 'Timestamp':
        return {
          kind: NodeKind.TIMESTAMP,
          value: value as Timestamp,
        }
      case 'Int32':
        return {
          kind: NodeKind.INT,
          value: value as Int32,
        }
      case 'Double':
        return {
          kind: NodeKind.DOUBLE,
          value: (value as Double).value,
        }
      case 'Long':
        return {
          kind: NodeKind.LONG,
          value: value as Long,
        }
      case 'BSONRegExp': {
        const { pattern, options } = value as BSONRegExp
        return {
          kind: NodeKind.REGEX,
          value: new RegExp(pattern, options), // TODO: escape?
        }
      }
      case 'Decimal128':
        return {
          kind: NodeKind.DECIMAL,
          value: value as Decimal128,
        }
      default:
        throw new TypeError(`Unsupported BSON type: ${bsonType}`)
    }
  }

  throw new TypeError(`Unsupported expression: ${value}`)
}

export function wrapObjectRaw(raw: Record<string, unknown> = {}): ObjectNode {
  const keys = Object.keys(raw)

  const value: Record<string, BSONNode> = {}
  for (let i = 0; i < keys.length; i++) {
    value[keys[i]] = wrapBSON(raw[keys[i]])
  }

  return {
    kind: NodeKind.OBJECT,
    keys,
    raw,
    value,
  }
}

export function setKey<T extends BSONNode>(
  obj: ObjectNode,
  key: string,
  value: T,
): T {
  if (!includes(obj.keys, key)) {
    obj.keys.push(key)
  }
  if (obj.raw) {
    obj.raw[key] = unwrapBSON(value) // needed to keep array/object references
  }
  obj.value[key] = value

  return value
}

export function unsetKey(obj: ObjectNode, key: string): boolean {
  const i = obj.keys.indexOf(key)
  if (i >= 0) {
    obj.keys.splice(i, 1)
    if (obj.raw) {
      delete obj.raw[key]
    }
    delete obj.value[key]
  }

  return i >= 0
}

export function wrapArrayRaw(raw: unknown[] = []): ArrayNode {
  return {
    kind: NodeKind.ARRAY,
    raw,
    value: raw.map(wrapBSON),
  }
}

export function setIndex<T extends BSONNode>(
  arr: ArrayNode,
  index: number,
  value: T,
): T {
  if (!arr.raw) {
    throw new Error('Expected array pointer')
  }

  while (arr.value.length <= index) {
    arr.raw.push(null)
    arr.value.push(nNullish())
  }

  arr.raw[index] = unwrapBSON(value) // needed to keep array/object references
  arr.value[index] = value

  return value
}

export function wrapNodes(value: BSONNode[]): ArrayNode {
  return {
    kind: NodeKind.ARRAY,
    raw: undefined,
    value,
  }
}

export function unwrapBSON(node: BSONNode): unknown {
  switch (node.kind) {
    case NodeKind.ARRAY:
      return node.raw || node.value.map(unwrapBSON)

    case NodeKind.OBJECT: {
      if (node.raw) {
        // Keeps the original user's value
        return node.raw
      }

      // Generate a new object
      const result: Record<string, unknown> = { ...node.value }
      for (let i = 0; i < node.keys.length; i++) {
        result[node.keys[i]] = unwrapBSON(expected(node.value[node.keys[i]]))
      }
      return result
    }

    default:
      return node.value
  }
}

export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.ARRAY,
  message?: string,
): ArrayNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.BINARY,
  message?: string,
): BinaryNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.BOOLEAN,
  message?: string,
): BooleanNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.DATE,
  message?: string,
): DateNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.DECIMAL,
  message?: string,
): DecimalNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.DOUBLE,
  message?: string,
): DoubleNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.INT,
  message?: string,
): IntNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.LONG,
  message?: string,
): LongNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.NULLISH,
  message?: string,
): NullishNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.OBJECT_ID,
  message?: string,
): ObjectIdNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.OBJECT,
  message?: string,
): ObjectNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.REGEX,
  message?: string,
): RegexNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.STRING,
  message?: string,
): StringNode
export function assertBSON(
  node: BSONNode,
  kind: typeof NodeKind.TIMESTAMP,
  message?: string,
): TimestampNode
export function assertBSON(
  node: BSONNode,
  kind: BSONNode['kind'],
  message?: string,
): BSONNode {
  if (node.kind !== kind) {
    throw new TypeError(
      message || `Unexpected BSON type ${node.kind} (expecting ${kind})`,
    )
  }
  return node
}

export function isBSONNumber(
  node: BSONNode,
): node is DateNode | DoubleNode | IntNode | LongNode {
  return (
    node.kind === NodeKind.DATE ||
    node.kind === NodeKind.DOUBLE ||
    node.kind === NodeKind.INT ||
    node.kind === NodeKind.LONG
  )
}

export function unwrapNumber(node: BSONNode, message?: string): number {
  switch (node.kind) {
    case NodeKind.DATE:
      return node.value.getTime()
    case NodeKind.DOUBLE:
      return node.value
    case NodeKind.INT:
      return node.value.value
    case NodeKind.LONG:
      return node.value.toNumber()
    case NodeKind.DECIMAL:
      throw new TypeError(
        'JavaScript cannot operate math operations against MongoDB Decimal types',
      )
    default:
      throw new TypeError(
        message || `Expected numeric value (got ${node.kind})`,
      )
  }
}

/**
 * This is NOT the MongoDB's decimal type! (sorry)
 */
export function unwrapDecimal(node: BSONNode, message?: string): Decimal {
  return Decimal(unwrapNumber(node, message))
}

export function assertNumber(
  node: BSONNode,
  message?: string,
): DateNode | DoubleNode | IntNode | LongNode {
  switch (node.kind) {
    case NodeKind.DATE:
    case NodeKind.DOUBLE:
    case NodeKind.INT:
    case NodeKind.LONG:
      return node
    case NodeKind.DECIMAL:
      throw new TypeError(
        'JavaScript cannot operate math operations against MongoDB Decimal types',
      )
    default:
      throw new TypeError(
        message || `Expected numeric value (got ${node.kind})`,
      )
  }
}

export function unwrapRegex(
  operator: string,
  regNode: BSONNode,
  regField: string,
  optNode: BSONNode,
  optField: string,
): RegExp {
  let regex: RegExp
  switch (regNode.kind) {
    case NodeKind.REGEX:
      regex = regNode.value
      break
    case NodeKind.STRING:
      regex = new RegExp(regNode.value) // TODO: escape?
      break
    default:
      throw new TypeError(
        `${operator} needs '${regField}' to be of type string or regex`,
      )
  }

  if (optNode.kind !== NodeKind.NULLISH) {
    const flags = assertBSON(
      optNode,
      NodeKind.STRING,
      `${operator} needs '${optField}' to be of type string`,
    ).value

    if (regex.flags) {
      throw new TypeError(
        `${operator}: found regex option(s) specified in both '${regField}' and '${optField}' fields`,
      )
    }

    // Inject flags
    regex = new RegExp(regex, flags)
  }

  return regex
}
