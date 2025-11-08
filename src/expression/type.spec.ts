import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $toInt } from './type.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$toInt', t => {
  const toInt = bind($toInt)

  t.throws(() => toInt(2_147_483_647.1), {
    message: 'Cannot convert 2147483647.1 to INT',
  })
  t.like(toInt(2_147_483_646.9), { value: 2_147_483_646 })
})
