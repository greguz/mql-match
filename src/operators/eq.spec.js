import test from 'ava'
import { ObjectId } from 'bson'

import { $eq, $ne } from './eq.js'

function equals (value) {
  return new Function('value', `return ${$eq('value', value)}`)
}

function unequals (value) {
  return new Function('value', `return ${$ne('value', value)}`)
}

test('$eq:undefined', t => {
  t.throws(() => equals(undefined))
})

test('$ne:undefined', t => {
  t.throws(() => unequals(undefined))
})

test('$eq:null', t => {
  const match = equals(null)
  t.true(match(undefined))
  t.true(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
})

test('$ne:null', t => {
  const match = unequals(null)
  t.false(match(undefined))
  t.false(match(null))
  t.true(match(''))
  t.true(match(42))
  t.true(match({}))
})

test('$eq:string', t => {
  const match = equals('Bigweld')
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.true(match('Bigweld'))
})

test('$eq:regexp', t => {
  const match = equals(/^\d+$/)
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.true(match('1'))
})

test('$eq:id', t => {
  const id = new ObjectId().toHexString()
  const match = equals(new ObjectId(id))
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(new ObjectId()))
  t.true(match(new ObjectId(id)))
})
