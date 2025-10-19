import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $avg, $sum } from './accumulators.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$avg', t => {
  const avg = bind($avg)

  t.is(avg(10, 6, 7), 7.666666666666667)
  t.is(avg(9, 10), 9.5)
  t.is(avg(4, 5, 5), 4.666666666666667)
})

test('$sum', t => {
  const sum = bind($sum)

  t.is(sum(), 0)
  t.is(sum(1), 1)
  t.is(sum(40, 2), 42)
})
