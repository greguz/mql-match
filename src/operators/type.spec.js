import test from 'ava'

import compile from './type.js'

function $type (code, value) {
  const variable = 'value'
  const a = compile(variable, code)
  const b = compile(variable, value)
  if (a !== b) {
    throw new Error('Expected same result')
  }
  return new Function(variable, `return ${a}`)
}

test('$type:double', t => {
  const match = $type('double', 1)
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(NaN))
  t.false(match({}))
  t.false(match('1'))
  t.false(match('1.1'))
  t.true(match(1))
  t.true(match(1.1))
})
