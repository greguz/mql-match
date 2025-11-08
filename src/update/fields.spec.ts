import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $inc, $rename } from './fields.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
}

test('$inc', t => {
  const inc = bind($inc)

  t.is(inc(null, -2), -2)
  t.is(inc(44, -2), 42)
})

test('$rename', t => {
  const rename = bind($rename)

  t.deepEqual(rename({ _value: 42 }, '_value', 'value'), { value: 42 })
})
