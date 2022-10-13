import test from 'ava'

import { $exists } from './exists.mjs'

test('$exists:true', t => {
  const match = $exists(true)

  t.false(match(undefined))
  t.true(match(null))
  t.true(match(''))
  t.true(match(0))
  t.true(match({}))
})

test('$exists:false', t => {
  const match = $exists(false)

  t.true(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(0))
  t.false(match({}))
})

test('$exists:error', t => {
  t.throws(() => $exists(undefined))
  t.throws(() => $exists(null))
  t.throws(() => $exists({}))
  t.throws(() => $exists(42))
  t.throws(() => $exists('true'))
})
