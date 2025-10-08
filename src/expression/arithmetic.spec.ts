import test from 'ava'

import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import { $abs, $multiply } from './arithmetic.js'

test('$multiply', t => {
  const multiply = (...args: unknown[]) =>
    unwrapBSON($multiply(...args.map(wrapBSON)))

  t.is(multiply(), 1)
  t.is(multiply(2, Number.NaN, 2), Number.NaN)
  t.is(multiply(2, undefined, 2), null)
  t.is(multiply(2, 3, 4), 24)
})

test('$abs', t => {
  const abs = (value: unknown) => unwrapBSON($abs(wrapBSON(value)))

  t.is(abs(+42), 42)
  t.is(abs(-42), 42)
})
