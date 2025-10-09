import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $eq } from './comparison.js'

function bind<T extends BSONNode>(
  fn: (...right: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => T['value'] {
  return (...left: unknown[]) =>
    fn(...left.map(wrapBSON), ...right.map(wrapBSON)).value
}

test('$eq', t => {
  const eq = bind($eq)

  t.true(eq(undefined, undefined))
  t.true(eq(undefined, null))
  t.true(eq(null, undefined))
  t.true(eq(null, null))
  t.true(eq('test', /T/i))

  const eqArray = bind($eq, ['A', 'B'])
  t.true(eqArray(['A', 'B']))
  t.true(eqArray([['A', 'B'], 'C']))
})
