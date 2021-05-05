import test from 'ava'
import { ObjectId } from 'bson'

import compile from './eq.js'

function $eq (value) {
  return new Function('value', `return ${compile('value', value)}`)
}

test('$eq:undefined', t => {
  t.throws(() => $eq(undefined))
})

test('$eq:null', t => {
  const match = $eq(null)
  t.true(match(undefined))
  t.true(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
})

test('$eq:string', t => {
  const match = $eq('Bigweld')
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.true(match('Bigweld'))
})

test('$eq:regexp', t => {
  const match = $eq(/^\d+$/)
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.true(match('1'))
})

test('$eq:id', t => {
  const id = new ObjectId().toHexString()
  const match = $eq(new ObjectId(id))
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(new ObjectId()))
  t.true(match(new ObjectId(id)))
})
