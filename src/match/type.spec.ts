import test from 'ava'
import { Double } from 'bson'

import { parseBSONType, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $exists, $type } from './type.js'

function bind<T extends BSONNode>(
  fn: (left: BSONNode, ...right: BSONNode[]) => T,
  ...right: unknown[]
): (left: unknown) => T['value'] {
  return (left: unknown) => fn(wrapBSON(left), ...right.map(wrapBSON)).value
}

test('$exists', t => {
  const exists = bind($exists, true)

  t.false(exists(undefined))
  t.false(exists(null))
  t.true(exists(''))
  t.true(exists(0))
  t.true(exists({}))

  const notExists = bind($exists, false)

  t.true(notExists(undefined))
  t.true(notExists(null))
  t.false(notExists(''))
  t.false(notExists(0))
  t.false(notExists({}))
})

function matchType(stringAlias: string, numberAlias: number) {
  const stringType = bind($type, parseBSONType(wrapBSON(stringAlias)))
  const numberType = bind($type, parseBSONType(wrapBSON(numberAlias)))

  return (left: unknown) => {
    const stringResult = stringType(left)
    const numberResult = numberType(left)
    if (stringResult !== numberResult) {
      throw new TypeError(
        `Expected matching results (got ${stringAlias} and ${numberAlias})`,
      )
    }

    return stringResult
  }
}

test('$type:double', t => {
  const match = matchType('double', 1)

  t.false(match(undefined))
  t.false(match(null))
  t.true(match(Number.NaN))
  t.true(match(Number.POSITIVE_INFINITY))
  t.true(match(Number.NEGATIVE_INFINITY))
  t.false(match({}))
  t.false(match('1'))
  t.false(match('1.1'))
  t.true(match(1))
  t.true(match(1.1))
  t.true(match(new Double(1)))
})

test('$type:object', t => {
  const match = matchType('object', 3)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(Number.NaN))
  t.true(match({}))
  t.false(match(new Date()))
  // t.false(match(Object(1))) // TODO: what to do?
  t.false(match(1))
})
