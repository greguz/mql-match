import test from 'ava'
import { ObjectId } from 'bson'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $cmp, $eq, $gt, $gte, $lt, $lte } from './comparison.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$cmp', t => {
  const cmp = (l: unknown, r: unknown) => $cmp(wrapBSON(l), wrapBSON(r)).value

  t.is(cmp(false, false), 0)
  t.is(cmp(true, false), 1)
  t.is(cmp(false, true), -1)
  t.is(cmp(true, true), 0)

  // string
  t.is(cmp('lol', 'lol'), 0)
  t.is(cmp('42', 42), 1)

  // arrays
  t.is(cmp([], []), 0)
  t.is(cmp([69], [42, 420]), 1)

  // objects
  t.is(cmp({}, {}), 0)
  t.is(cmp({ hello: 'world' }, { hello: 'world' }), 0)
})

test('$eq:null', t => {
  const match = bind($eq, null)

  t.true(match(undefined))
  t.true(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
})

test('$eq:string', t => {
  const match = bind($eq, 'Bigweld')

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.true(match('Bigweld'))
})

test('$eq:id', t => {
  const match = bind($eq, new ObjectId('696969696969696969696969'))

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(new ObjectId()))
  t.true(match(new ObjectId('696969696969696969696969')))
})

test('$eq:date', t => {
  const match = bind($eq, new Date('2025-10-08T16:33:26.531Z'))

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(false))
  t.false(match(new Date(0)))
  t.true(match(new Date(1759941206531)))
})

test('$eq:object', t => {
  const match = bind($eq, {
    a: true,
    b: 42,
    c: 'Hello World',
  })

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(false))
  t.false(match(new Date()))
  t.true(
    match({
      a: true,
      b: 42,
      c: 'Hello World',
    }),
  )
  t.false(
    match({
      a: true,
      b: 42,
    }),
  )
})

test('$eq:array', t => {
  const match = bind($eq, [true, 42, 'Hello World'])

  t.false(match(undefined))
  t.false(match(null))
  t.false(match({}))
  t.false(match([]))
  t.true(match([true, 42, 'Hello World']))
  t.false(match([42, true, 'Hello World']))
  t.false(match([true, 42]))
})

test('$eq:empty-object', t => {
  const match = bind($eq, {})

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.true(match({}))
  t.false(match(false))
  t.false(match(new Date()))
  t.false(match({ a: 'value' }))
})

test('$gt', t => {
  const match = bind($gt, 42)

  t.false(match(undefined))
  t.false(match(null))
  t.true(match(''))
  t.true(match({}))
  t.false(match(41))
  t.false(match(42))
  t.true(match(43))
})

test('$gte', t => {
  const match = bind($gte, 42)

  t.false(match(undefined))
  t.false(match(null))
  t.true(match(''))
  t.true(match({}))
  t.false(match(41))
  t.true(match(42))
  t.true(match(43))
})

test('$lt', t => {
  const match = bind($lt, 42)

  t.true(match(undefined))
  t.true(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(41))
  t.false(match(42))
  t.false(match(43))
})

test('$lte', t => {
  const match = bind($lte, 42)

  t.true(match(undefined))
  t.true(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(41))
  t.true(match(42))
  t.false(match(43))
})
