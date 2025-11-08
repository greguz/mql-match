import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import type { BooleanNode } from '../lib/node.js'
import { $size } from './array.js'

function bind(
  fn: (...args: any[]) => BooleanNode,
  ...right: unknown[]
): (...left: unknown[]) => boolean {
  return (...left: unknown[]) =>
    fn(...left.map(wrapBSON), ...right.map(wrapBSON)).value
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
