import test from 'ava'

import { _compile } from '../code.mjs'
import { $type } from './type.mjs'

function compile (code, value) {
  const variable = 'value'
  const a = $type(variable, code)
  const b = $type(variable, value)
  if (a !== b) {
    throw new Error('Expected same result')
  }
  return _compile({ arguments: [variable], body: `return ${a}` })
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
