import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $pop } from './array.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$pop', t => {
  const pop = bind($pop)

  t.deepEqual(pop(['f', null, 'l'], -1), [null, 'l'])
  t.deepEqual(pop(['f', null, 'l'], 1), ['f', null])
})
