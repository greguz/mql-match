import test from 'ava'

import { $size } from './size.mjs'

test('filter:$size', t => {
  const match = $size(1)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match({}))
  t.false(match([]))
  t.true(match(['a']))
  t.false(match(['b', 'c']))
})
