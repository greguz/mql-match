import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $mod } from './miscellaneous.js'

function bind<T extends BSONNode>(
  fn: (left: BSONNode, ...right: BSONNode[]) => T,
  ...right: unknown[]
): (left: unknown) => T['value'] {
  return (left: unknown) => fn(wrapBSON(left), ...right.map(wrapBSON)).value
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
