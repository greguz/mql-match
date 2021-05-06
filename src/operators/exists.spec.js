import test from 'ava'

import { $size } from './size.js'

function compile (value) {
  return new Function('value', `return ${$size('value', value)}`)
}

test('$size', t => {
  t.throws(() => compile('0'))
  t.throws(() => compile(-1))
  t.throws(() => compile(1.1))

  const match = compile(1)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(0))
  t.false(match({}))
  t.false(match([]))
  t.true(match([{ ok: true }]))
})
