import test from 'ava'

import { $all } from './all.mjs'

test('filter:$all', t => {
  t.throws(() => $all({}))
  t.throws(() => $all([]))

  const match = $all([42, 'Hello World', true])

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
