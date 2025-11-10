import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import { $inc } from './field.js'

test('$inc', t => {
  const inc = (value: unknown, arg: unknown) =>
    unwrapBSON($inc(wrapBSON(arg))(wrapBSON(value)))

  t.is(inc(null, -2), -2)
  t.is(inc(44, -2), 42)
})
