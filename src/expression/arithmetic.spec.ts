import test from 'ava'

import { parseValueNode as n } from '../node.js'
import { $multiply } from './arithmetic.js'

test('$multiply', t => {
  t.is($multiply().value, 1)
  t.is($multiply(n(2), n(Number.NaN), n(2)).value, Number.NaN)
  t.is($multiply(n(2), n(), n(2)).value, null)
  t.is($multiply(n(2), n(3), n(4)).value, 24)
})
