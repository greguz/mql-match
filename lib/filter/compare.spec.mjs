import test from 'ava'

import { $gt, $gte, $lt, $lte } from './compare.mjs'

test('filter:$gt', t => {
  const match = $gt(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.false(match(41))
  t.false(match(42))
  t.true(match(43))
})

test('filter:$gte', t => {
  const match = $gte(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.false(match(41))
  t.true(match(42))
  t.true(match(43))
})

test('filter:$lt', t => {
  const match = $lt(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(41))
  t.false(match(42))
  t.false(match(43))
})

test('filter:$lte', t => {
  const match = $lte(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(41))
  t.true(match(42))
  t.false(match(43))
})
