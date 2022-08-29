import test from 'ava'

import { $gt, $gte, $lt, $lte } from './compare.mjs'

function greaterThan (value) {
  // eslint-disable-next-line
  return new Function('value', `return ${$gt('value', value)}`)
}

function greaterThanOrEqual (value) {
  // eslint-disable-next-line
  return new Function('value', `return ${$gte('value', value)}`)
}

function lessThan (value) {
  // eslint-disable-next-line
  return new Function('value', `return ${$lt('value', value)}`)
}

function lessThanOrEqual (value) {
  // eslint-disable-next-line
  return new Function('value', `return ${$lte('value', value)}`)
}

test('$gt:number', t => {
  const match = greaterThan(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.false(match(41))
  t.false(match(42))
  t.true(match(43))
})

test('$gte:number', t => {
  const match = greaterThanOrEqual(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.false(match(41))
  t.true(match(42))
  t.true(match(43))
})

test('$lt:number', t => {
  const match = lessThan(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(41))
  t.false(match(42))
  t.false(match(43))
})

test('$lte:number', t => {
  const match = lessThanOrEqual(42)

  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match({}))
  t.true(match(41))
  t.true(match(42))
  t.false(match(43))
})
