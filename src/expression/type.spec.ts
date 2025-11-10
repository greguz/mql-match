import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import { $toInt } from './type.js'

test('$toInt', t => {
  const toInt = (value: unknown) => unwrapBSON($toInt(wrapBSON(value)))

  t.throws(() => toInt(2_147_483_647.1), {
    message: 'Cannot convert 2147483647.1 to INT',
  })
  t.like(toInt(2_147_483_646.9), { value: 2_147_483_646 })
})
