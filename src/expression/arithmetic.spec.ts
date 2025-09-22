import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import { $multiply } from './arithmetic.js'

test('$multiply', t => {
  const multiply = (...args: unknown[]) => $multiply(args.map(wrapBSON)).value

  t.is(multiply(), 1)
  t.is(multiply(2, Number.NaN, 2), Number.NaN)
  t.is(multiply(2, undefined, 2), null)
  t.is(multiply(2, 3, 4), 24)
})
