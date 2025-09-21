import test from 'ava'
import { Long } from 'bson'

import { parseValueNode as n } from '../node.js'
import { $cmp, $gt } from './comparison.js'

test('$cmp', t => {
  t.like($cmp(n('lol'), n('lol')), { value: 0 })
  t.like($cmp(n('42'), n(42)), { value: 1 })
})

test('$gt', t => {
  t.like($gt(n(Long.fromNumber(43)), n(42)), { value: true })
  t.like($gt(n(Long.fromNumber(42)), n(42)), { value: false })
})
