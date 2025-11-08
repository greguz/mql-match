import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import type { BSONNode } from '../lib/node.js'
import {
  $abs,
  $ceil,
  $divide,
  $exp,
  $floor,
  $log,
  $mod,
  $multiply,
  $pow,
  $round,
  $subtract,
  $trunc,
} from './arithmetic.js'

function bind<T extends BSONNode>(
  fn: (...args: BSONNode[]) => T,
  ...right: unknown[]
): (...left: unknown[]) => unknown {
  return (...left: unknown[]) =>
    unwrapBSON(fn(...left.map(wrapBSON), ...right.map(wrapBSON)))
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

test('$ceil', t => {
  const ceil = bind($ceil)

  t.is(ceil(null), null)
  t.true(Number.isNaN(ceil(Number.NaN)))
  t.is(ceil(1), 1)
  t.is(ceil(7.8), 8)
  t.is(ceil(-2.8), -2)
  t.is(ceil(9.25), 10)
  t.is(ceil(8.73), 9)
  t.is(ceil(4.32), 5)
  t.is(ceil(-5.34), -5)
})

test('$divide', t => {
  const divide = bind($divide)

  t.is(divide(null, 1), null)
  t.is(divide(1, null), null)
  t.is(divide(80, 8), 10)
  t.is(divide(40, 8), 5)
  t.throws(() => divide(10, 0))
})

test('$floor', t => {
  const floor = bind($floor)

  t.is(floor(1), 1)
  t.is(floor(7.8), 7)
  t.is(floor(-2.8), -3)
  t.is(floor(9.25), 9)
  t.is(floor(8.73), 8)
  t.is(floor(4.32), 4)
  t.is(floor(-5.34), -6)
})

test('$log', t => {
  const log = bind($log)

  t.is(log(100, 10), 2)
  t.is(log(100, Math.E), 4.605170185988092)
  t.is(log(5, 2), 2.321928094887362)
  t.is(log(2, 2), 1)
  t.is(log(23, 2), 4.523561956057013)
  t.is(log(10, 2), 3.321928094887362)
})

test('$pow', t => {
  const pow = bind($pow)

  t.is(pow(5, 0), 1)
  t.is(pow(5, 2), 25)
  t.is(pow(5, -2), 0.04)
  t.true(Number.isNaN(pow(-5, 0.5)))
})

test('$trunc', t => {
  const trunc = bind($trunc)

  t.true(Number.isNaN(trunc(Number.NaN, 1)))
  t.is(trunc(null, 1), null)
  t.is(trunc(Number.POSITIVE_INFINITY, 1), Number.POSITIVE_INFINITY)
  t.is(trunc(Number.NEGATIVE_INFINITY, 1), Number.NEGATIVE_INFINITY)

  t.is(trunc(19.25, 1), 19.2)
  t.is(trunc(28.73, 1), 28.7)
  t.is(trunc(34.32, 1), 34.3)
  t.is(trunc(-45.34, 1), -45.3)

  t.is(trunc(19.25, -1), 10)
  t.is(trunc(28.73, -1), 20)
  t.is(trunc(34.32, -1), 30)
  t.is(trunc(-45.34, -1), -40)

  t.is(trunc(19.25, 0), 19)
  t.is(trunc(28.73, 0), 28)
  t.is(trunc(34.32, 0), 34)
  t.is(trunc(-45.34, 0), -45)
})

test('$subtract', t => {
  const subtract = bind($subtract)

  const date = subtract(new Date(50), 1)
  t.true(date instanceof Date)

  t.is(subtract(1, null), null)
  t.is(subtract(null, 1), null)
  t.is(subtract(48, 6), 42)
})
