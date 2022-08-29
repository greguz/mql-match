import test from 'ava'

import { $in, $nin } from './in.mjs'

function includes (values) {
  // eslint-disable-next-line
  return new Function('values', `return ${$in('values', values)}`)
}

function excludes (values) {
  // eslint-disable-next-line
  return new Function('values', `return ${$nin('values', values)}`)
}

test('$in', t => {
  t.throws(() => includes({}))

  const match = includes([42, 'Hello World', true])
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
  t.throws(() => excludes({}))

  const match = excludes([42, 'Hello World', true])
  t.false(match(42))
  t.false(match('Hello World'))
  t.false(match(true))

  t.true(match(undefined))
  t.true(match(null))
  t.true(match(''))
  t.true(match(0))
  t.true(match({}))
})
