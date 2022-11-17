import test from 'ava'

import { $pop } from './pop.mjs'

test('update:$pop:array-shift', t => {
  const fn = $pop('arr', -1)
  const obj = { arr: ['f', null, 'l'] }
  fn(obj)
  t.deepEqual(obj, { arr: [null, 'l'] })
})

test('update:$pop:array-pop', t => {
  const fn = $pop('arr', 1)
  const obj = { arr: ['f', null, 'l'] }
  fn(obj)
  t.deepEqual(obj, { arr: ['f', null] })
})
