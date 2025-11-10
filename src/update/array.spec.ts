import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import { $pop } from './array.js'

test('$pop', t => {
  const pop = (value: unknown, arg: unknown) =>
    unwrapBSON($pop(wrapBSON(arg))(wrapBSON(value)))

  t.deepEqual(pop(['f', null, 'l'], -1), [null, 'l'])
  t.deepEqual(pop(['f', null, 'l'], 1), ['f', null])
})
