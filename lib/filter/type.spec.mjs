import test from 'ava'

import { $type } from './type.mjs'

function compile (code, value) {
  const a = $type(code)
  const b = $type(value)
  return value => {
    const c = a(value)
    const d = b(value)
    if (c !== d) {
      throw new Error('Expected same result')
    }
    return c
  }
}

test('$type:double', t => {
  const match = compile('double', 1)
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(NaN))
  t.false(match({}))
  t.false(match('1'))
  t.false(match('1.1'))
  t.true(match(1))
  t.true(match(1.1))
})

test('$type:object', t => {
  const match = compile('object', 3)
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(NaN))
  t.true(match({}))
  t.false(match(new Date()))
  t.false(match(Object(1)))
  t.false(match(1))
})
