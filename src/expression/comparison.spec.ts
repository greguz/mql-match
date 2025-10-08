import test from 'ava'
import { Long } from 'bson'

import { wrapBSON } from '../lib/bson.js'
import { $cmp, $gt } from './comparison.js'

test('$cmp string', t => {
  const cmp = (l: unknown, r: unknown) => $cmp(wrapBSON(l), wrapBSON(r)).value

  t.is(cmp('lol', 'lol'), 0)
  t.is(cmp('42', 42), 1)
})

test('$cmp arrays', t => {
  const cmp = (l: unknown, r: unknown) => $cmp(wrapBSON(l), wrapBSON(r)).value

  t.is(cmp([], []), 0)
  t.is(cmp([69], [42, 420]), 1)
})

test('$cmp objects', t => {
  const cmp = (l: unknown, r: unknown) => $cmp(wrapBSON(l), wrapBSON(r)).value

  t.is(cmp({}, {}), 0)
})

test('$gt', t => {
  const gt = (l: unknown, r: unknown) => $gt(wrapBSON(l), wrapBSON(r)).value

  t.is(gt(Long.fromNumber(43), 42), true)
  t.is(gt(Long.fromNumber(42), 42), false)
})
