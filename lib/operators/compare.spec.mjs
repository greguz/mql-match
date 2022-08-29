import test from 'ava'

import { _compile } from '../code.mjs'
import { $gt, $gte, $lt, $lte } from './compare.mjs'

function greaterThan (value) {
  return _compile({ arguments: ['value'], body: `return ${$gt('value', value)}` })
}

function greaterThanOrEqual (value) {
  return _compile({ arguments: ['value'], body: `return ${$gte('value', value)}` })
}

function lessThan (value) {
  return _compile({ arguments: ['value'], body: `return ${$lt('value', value)}` })
}

function lessThanOrEqual (value) {
  return _compile({ arguments: ['value'], body: `return ${$lte('value', value)}` })
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
