import test from 'ava'

import { _compile } from '../code.mjs'
import { $all } from './all.mjs'

function compile (value) {
  return _compile({ arguments: ['value'], body: `return ${$all('value', value)}` })
}

test('$all', t => {
  t.throws(() => compile({}))
  t.throws(() => compile([]))

  const match = compile([42, 'Hello World', true])

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(0))
  t.false(match({}))
  t.false(match([]))
  t.false(match([42]))
  t.false(match(['Hello World']))
  t.false(match([true]))
  t.true(match([42, 'Hello World', true]))
})
