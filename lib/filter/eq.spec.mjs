import test from 'ava'
import { ObjectId } from 'bson'

import { $eq } from './eq.mjs'

test('filter:$eq:null', t => {
  const match = $eq(null)
  t.true(match(undefined))
  t.true(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
})

test('filter:$eq:string', t => {
  const match = $eq('Bigweld')
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.true(match('Bigweld'))
})

test('filter:$eq:id', t => {
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

test('filter:$eq:date', t => {
  const date = new Date().toISOString()
  const match = $eq(new Date(date))
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.false(match({}))
  t.false(match(false))
  t.false(match(new Date(0)))
  t.true(match(new Date(date)))
})

test('filter:$eq:object', t => {
  const match = $eq({
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

test('filter:$eq:array', t => {
  const match = $eq([
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

test('filter:$eq:empty-object', t => {
  const match = $eq({})
  t.false(match(undefined))
  t.false(match(null))
  t.false(match(''))
  t.false(match(42))
  t.true(match({}))
  t.false(match(false))
  t.false(match(new Date()))
  t.true(match({
    a: true,
    b: 42,
    c: 'Hello World'
  }))
  t.true(match({
    a: true,
    b: 42
  }))
})
