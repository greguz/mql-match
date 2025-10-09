import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import { $abs, $exp, $mod, $multiply, $round } from './arithmetic.js'

function bind<T extends BSONNode>(
  fn: (...right: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => T['value'] {
  return (...left: unknown[]) =>
    fn(...left.map(wrapBSON), ...right.map(wrapBSON)).value
}

test('$multiply', t => {
  const multiply = bind($multiply)

  t.is(multiply(), 1)
  t.is(multiply(2, Number.NaN, 2), Number.NaN)
  t.is(multiply(2, undefined, 2), null)
  t.is(multiply(2, 3, 4), 24)
})

test('$abs', t => {
  const abs = bind($abs)

  t.is(abs(+42), 42)
  t.is(abs(-42), 42)
})

test('$mod', t => {
  const mod = bind($mod)

  t.is(mod(3, 2), 1)
  t.is(mod(4, 2), 0)
  t.is(mod(80, 7), 3)
  t.is(mod(40, 4), 0)
  t.is(mod(-13, 9), -4)
})

test('$round', t => {
  const round = bind($round)

  t.true(Number.isNaN(round(Number.NaN, 1)))
  t.is(round(null, 1), null)
  t.is(round(Number.POSITIVE_INFINITY, 1), Number.POSITIVE_INFINITY)
  t.is(round(Number.NEGATIVE_INFINITY, 1), Number.NEGATIVE_INFINITY)

  t.is(round(10.5, null), 10)
  t.is(round(11.5, null), 12)
  t.is(round(12.5, null), 12)
  t.is(round(13.5, null), 14)
})

test('$exp', t => {
  const exp = bind($exp)

  t.is(exp(0), 1)
  t.is(exp(2), 7.38905609893065)
  t.is(exp(-2), 0.1353352832366127)
})
