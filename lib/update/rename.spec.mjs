import test from 'ava'

import { $rename } from './rename.mjs'

test('update:$rename:simple', t => {
  const fn = $rename('_value', 'value')
  const obj = { _value: 42 }
  fn(obj)
  t.deepEqual(obj, { value: 42 })
})
