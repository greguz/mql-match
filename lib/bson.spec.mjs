import test from 'ava'
import {
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp
} from 'bson'
import { Buffer } from 'buffer'

import {
  BSON,
  getBSONType,
  isBinary,
  isDecimal128,
  isDouble,
  isFalsy,
  isInt32,
  isJavaScript,
  isLong,
  isMaxKey,
  isMinKey,
  isNumber,
  isObjectId,
  isReference,
  isRegExp,
  isSymbol,
  isTimestamp,
  isTruthy,
  n
} from './bson.mjs'

test('bson:isMaxKey', t => {
  const key = new MaxKey()
  t.true(isMaxKey(key))
  t.is(getBSONType(key), BSON.MaxKey)
})

test('bson:isMinKey', t => {
  const key = new MinKey()
  t.true(isMinKey(key))
  t.is(getBSONType(key), BSON.MinKey)
})

test('bson:isJavaScript', t => {
  t.false(isJavaScript(undefined))
  t.false(isJavaScript(null))
  t.true(isJavaScript(() => {}))
  t.true(isJavaScript(new Code(() => {})))
  t.is(getBSONType(() => {}), BSON.JavaScript)
})

test('bson:isBinary', t => {
  t.false(isBinary(undefined))
  t.false(isBinary(null))
  t.true(isBinary(Buffer.from('buffer')))
  t.true(isBinary(new Binary([0x2a])))
  t.is(getBSONType(Buffer.from('buffer')), BSON.Binary)
  t.is(getBSONType(new Binary([0x2a])), BSON.Binary)
})

test('bson:isNumber', t => {
  t.false(isNumber(undefined))
  t.false(isNumber(null))
  t.true(isNumber(1))
  t.true(isNumber(2n))
  t.true(isNumber(NaN))
  t.true(isNumber(Infinity))
  t.true(isNumber(new Int32(6)))
  t.true(isNumber(new Double(7)))
  t.true(isNumber(new Long('8')))
  t.true(isNumber(new Decimal128('9')))
})

test('bson:isInt32', t => {
  t.false(isInt32(undefined))
  t.false(isInt32(null))
  t.true(isInt32(2147483647))
  t.false(isInt32(2147483648))
  t.is(getBSONType(new Int32(42)), BSON.Int32)
})

test('bson:isLong', t => {
  t.false(isLong(undefined))
  t.false(isLong(null))
  t.is(getBSONType(new Long('42')), BSON.Long)
})

test('bson:isDecimal128', t => {
  t.false(isDecimal128(undefined))
  t.false(isDecimal128(null))
  t.true(isDecimal128(new Decimal128('24')))
  t.is(getBSONType(new Decimal128('42')), BSON.Decimal128)
})

test('bson:isObjectId', t => {
  const id = new ObjectId()
  t.true(isObjectId(id))
  t.false(isObjectId(id.toHexString()))
  t.is(getBSONType(id), BSON.ObjectId)
})

test('bson:isRegExp', t => {
  t.false(isRegExp(undefined))
  t.false(isRegExp(null))
  t.true(isRegExp(/a/))
  t.true(isRegExp(new BSONRegExp('a')))
  t.is(getBSONType(/b/), BSON.RegExp)
  t.is(getBSONType(new BSONRegExp('b')), BSON.RegExp)
})

test('bson:isTimestamp', t => {
  t.false(isTimestamp(undefined))
  t.false(isTimestamp(null))
  t.false(isTimestamp(new Date()))
  t.true(isTimestamp(new Timestamp()))
  t.is(getBSONType(new Timestamp()), BSON.Timestamp)
})

test('bson:isReference', t => {
  t.false(isReference(undefined))
  t.false(isReference(null))
  t.true(isReference(new DBRef('myCollection', new ObjectId())))
  t.is(getBSONType(new DBRef('myCollection', new ObjectId())), BSON.Reference)
})

test('bson:isSymbol', t => {
  t.false(isSymbol(undefined))
  t.false(isSymbol(null))
  t.true(isSymbol(new BSONSymbol('mySymbol')))
  t.is(getBSONType(new BSONSymbol('mySymbol')), BSON.Symbol)
})

test('bson:isDouble', t => {
  t.false(isDouble(undefined))
  t.false(isDouble(null))
  t.true(isDouble(0))
  t.true(isDouble(NaN))
  t.true(isDouble(Number.POSITIVE_INFINITY))
  t.true(isDouble(-4.2))
  t.true(isDouble(new Double(42)))
  t.is(getBSONType(new Double(42)), BSON.Double)
})

test('bson:isFalsy', t => {
  t.false(isFalsy(NaN))
  t.true(isFalsy(0))
  t.true(isFalsy(new Double(0)))
  t.true(isFalsy(false))
  t.false(isFalsy(true))
  t.true(isFalsy(new Int32(0)))
  t.true(isFalsy(Long.fromInt(0)))
})

test('bson:isTruthy', t => {
  t.true(isTruthy(NaN))
  t.false(isTruthy(0))
  t.false(isTruthy(false))
  t.true(isTruthy(true))
})

test('bson:n', t => {
  t.is(n(0n), 0)
  t.is(n(10n), 10)
  t.is(n(new Double(NaN)), NaN)
  t.is(n(new Int32(42)), 42)
  t.is(n(Long.fromBigInt(30n)), 30)
  t.is(n(8), 8)
  t.throws(() => n(new Decimal128('0')))
})
