import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import { $inc } from './fields.js'

test('$inc', t => {
  t.is($inc(wrapBSON(null), wrapBSON(-2)).value, -2)
  t.is($inc(wrapBSON(44), wrapBSON(-2)).value, 42)
})
