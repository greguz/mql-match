import test from 'ava'

import { $exists } from './exists.mjs'

function compile (value) {
  // eslint-disable-next-line
  return new Function('value', `return ${$exists('value', value)}`)
}

test('$exists:true', t => {
  const match = compile(true)

  t.false(match(undefined))
  t.true(match(null))
  t.true(match(''))
  t.true(match(0))
  t.true(match({}))
})

test('$exists:false', t => {
  const match = compile(false)

  t.true(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(0))
  t.false(match({}))
})

test('$exists:error', t => {
  t.throws(() => compile(undefined))
  t.throws(() => compile(null))
  t.throws(() => compile({}))
  t.throws(() => compile(42))
  t.throws(() => compile('true'))
})
