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

test('$eq:date', t => {
  const date = new Date().toISOString()
  const match = equals(new Date(date))
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(false))
  t.false(match(new Date(0)))
  t.true(match(new Date(date)))
})

test('$eq:object', t => {
  const match = equals({
    a: true,
    b: 42,
    c: 'Hello World'
  })
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(false))
  t.false(match(new Date()))
  t.true(match({
    a: true,
    b: 42,
    c: 'Hello World'
  }))
  t.false(match({
    a: true,
    b: 42
  }))
})

test('$eq:array', t => {
  const match = equals([
    true,
    42,
    'Hello World'
  ])
  t.false(match(undefined))
  t.false(match(null))
  t.false(match({}))
  t.false(match([]))
  t.true(match([true, 42, 'Hello World']))
  t.false(match([42, true, 'Hello World']))
  t.false(match([true, 42]))
})

test('$eq:empty-object', t => {
  const match = equals({})
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.true(match({}))
  t.false(match(false))
  t.false(match(new Date()))
  t.false(match({
    a: true,
    b: 42,
    c: 'Hello World'
  }))
  t.false(match({
    a: true,
    b: 42
  }))
})
