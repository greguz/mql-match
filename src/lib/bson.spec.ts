import test from 'ava'
import {
  Binary,
  BSONRegExp,
  Decimal128,
  Double,
  Int32,
  Long,
  ObjectId,
  Timestamp,
} from 'bson'

import { wrapBSON } from './bson.js'
import { NodeKind } from './node.js'

// test('isMaxKey', t => {
//   const key = new MaxKey()
//   t.true(isMaxKey(key))
//   t.is(getBSONType(key), BSON.MaxKey)
// })

// test('isMinKey', t => {
//   const key = new MinKey()
//   t.true(isMinKey(key))
//   t.is(getBSONType(key), BSON.MinKey)
// })

// test('isJavaScript', t => {
//   t.false(isJavaScript(undefined))
//   t.false(isJavaScript(null))
//   t.true(isJavaScript(() => {}))
//   t.true(isJavaScript(new Code(() => {})))
//   t.is(
//     getBSONType(() => {}),
//     BSON.JavaScript,
//   )
// })

test('isBinary', t => {
  const isBinary = (value: unknown) => wrapBSON(value).kind === NodeKind.BINARY

  t.false(isBinary(undefined))
  t.false(isBinary(null))
  t.false(isBinary([]))
  t.true(isBinary(new Uint8Array([0x42])))
  t.true(isBinary(Binary.fromBits([0, 1, 0, 1])))
})

test('isInt', t => {
  const isInt = (value: unknown) => wrapBSON(value).kind === NodeKind.INT

  t.false(isInt(undefined))
  t.false(isInt(null))
  t.true(isInt(new Int32(42)))
  t.false(isInt(2147483648)) // Double
})

test('isLong', t => {
  const isLong = (value: unknown) => wrapBSON(value).kind === NodeKind.LONG

  t.false(isLong(undefined))
  t.false(isLong(null))
  t.true(isLong(Long.fromString('42')))
})

test('isDecimal', t => {
  const isDecimal = (value: unknown) =>
    wrapBSON(value).kind === NodeKind.DECIMAL

  t.false(isDecimal(undefined))
  t.false(isDecimal(null))
  t.true(isDecimal(new Decimal128('24')))
})

test('isObjectId', t => {
  const isObjectId = (value: unknown) =>
    wrapBSON(value).kind === NodeKind.OBJECT_ID

  const id = new ObjectId()
  t.true(isObjectId(id))
  t.false(isObjectId(id.toHexString()))
})

test('isRegExp', t => {
  const isRegExp = (value: unknown) => wrapBSON(value).kind === NodeKind.REGEX

  t.false(isRegExp(undefined))
  t.false(isRegExp(null))
  t.true(isRegExp(/a/))
  t.true(isRegExp(new BSONRegExp('a')))
})

test('isTimestamp', t => {
  const isTimestamp = (value: unknown) =>
    wrapBSON(value).kind === NodeKind.TIMESTAMP

  t.false(isTimestamp(undefined))
  t.false(isTimestamp(null))
  t.false(isTimestamp(new Date()))
  t.true(isTimestamp(Timestamp.fromNumber(0)))
})

// test('isReference', t => {
//   t.false(isReference(undefined))
//   t.false(isReference(null))
//   t.true(isReference(new DBRef('myCollection', new ObjectId())))
//   t.is(getBSONType(new DBRef('myCollection', new ObjectId())), BSON.Reference)
// })

// test('isSymbol', t => {
//   t.false(isSymbol(undefined))
//   t.false(isSymbol(null))
//   t.true(isSymbol(new BSONSymbol('mySymbol')))
//   t.is(getBSONType(new BSONSymbol('mySymbol')), BSON.Symbol)
// })

test('isDouble', t => {
  const isDouble = (value: unknown) => wrapBSON(value).kind === NodeKind.DOUBLE

  t.false(isDouble(undefined))
  t.false(isDouble(null))
  t.true(isDouble(0))
  t.true(isDouble(Number.NaN))
  t.true(isDouble(Number.POSITIVE_INFINITY))
  t.true(isDouble(-4.2))
  t.true(isDouble(new Double(42)))
})

// test('isFalsy', t => {
//   t.false(isFalsy(NaN))
//   t.true(isFalsy(0))
//   t.true(isFalsy(new Double(0)))
//   t.true(isFalsy(false))
//   t.false(isFalsy(true))
//   t.true(isFalsy(new Int32(0)))
//   t.true(isFalsy(Long.fromInt(0)))
// })

// test('isTruthy', t => {
//   t.true(isTruthy(NaN))
//   t.false(isTruthy(0))
//   t.false(isTruthy(false))
//   t.true(isTruthy(true))
// })
