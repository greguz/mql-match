import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $size } from './array.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$size', t => {
  const match = bind($size, 1)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match({}))
  t.false(match([]))
  t.true(match(['a']))
  t.false(match(['b', 'c']))
})
