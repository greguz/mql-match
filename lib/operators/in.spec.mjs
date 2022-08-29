import test from 'ava'

import { _compile } from '../code.mjs'
import { $in, $nin } from './in.mjs'

function includes (values) {
  return _compile({ arguments: ['value'], body: `return ${$in('value', values)}` })
}

function excludes (values) {
  return _compile({ arguments: ['value'], body: `return ${$nin('value', values)}` })
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
