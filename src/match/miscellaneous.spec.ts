import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $mod } from './miscellaneous.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$mod', t => {
  const mod = bind($mod, 2, 0)

  t.false(mod(undefined))
  t.false(mod(null))
  t.false(mod(''))
  t.false(mod({}))
  t.true(mod(0))
  t.false(mod(1))
  t.true(mod(2))
})
