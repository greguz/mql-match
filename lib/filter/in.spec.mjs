import test from 'ava'

import { $in } from './in.mjs'
import { $not } from './logic.mjs'

function $nin (values) {
  return $not($in(values))
}

test('$in', t => {
  t.throws(() => $in({}))

  const match = $in([42, 'Hello World', true])
  t.true(match(42))
  t.true(match('Hello World'))
  t.true(match(true))

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(0))
  t.false(match({}))
})

test('$nin', t => {
  t.throws(() => $nin({}))

  const match = $nin([42, 'Hello World', true])
  t.false(match(42))
  t.false(match('Hello World'))
  t.false(match(true))

  t.true(match(undefined))
  t.true(match(null))
  t.true(match(''))
  t.true(match(0))
  t.true(match({}))
})