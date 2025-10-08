import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $size } from './array.js'

function bind<T extends BSONNode>(
  fn: (left: BSONNode, right: BSONNode) => T,
  right: unknown,
): (left: unknown) => T['value'] {
  return (left: unknown) => fn(wrapBSON(left), wrapBSON(right)).value
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
