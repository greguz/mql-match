import test from 'ava'

import { $mod } from './mod.mjs'

test('$mod', t => {
  t.throws(() => $mod(2))
  t.throws(() => $mod([]))
  t.throws(() => $mod([2]))

  const match = $mod([2, 0])

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(0))
  t.false(match(1))
  t.true(match(2))
})
