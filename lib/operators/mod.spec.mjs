import test from 'ava'

import { _compile } from '../code.mjs'
import { $mod } from './mod.mjs'

function compile (value) {
  return _compile({ arguments: ['value'], body: `return ${$mod('value', value)}` })
}

test('$mod', t => {
  t.throws(() => compile(2))
  t.throws(() => compile([]))
  t.throws(() => compile([2]))

  const match = compile([2, 0])

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(0))
  t.false(match(1))
  t.true(match(2))
})
