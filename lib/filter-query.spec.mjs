import test from 'ava'
import { ObjectId } from 'bson'

import { compileFilterQuery as compile } from './filter-query.mjs'

test('mql:double-negation', t => {
  const match = compile({
    n: {
      $not: {
        $ne: 42
      }
    }
  })

  t.false(match({ n: 0 }))
  t.true(match({ n: 42 }))
})

test('mql:paths', t => {
  const match = compile({ 'a.b.c': 42 })

  t.true(match({ a: { b: { c: 42 } } }))
  t.true(match({ a: [{ b: { c: 42 } }] }))
  t.true(match({ a: { b: [{ c: 42 }] } }))
  t.true(match({ a: [{ b: [{ c: 42 }] }] }))

  t.false(match({ a: { b: { c: 0 } } }))
  t.false(match({ a: [{ b: { c: 0 } }] }))
  t.false(match({ a: { b: [{ c: 0 }] } }))
  t.false(match({ a: [{ b: [{ c: 0 }] }] }))
})

test('mql:match-array', t => {
  const match = compile({
    items: {
      $elemMatch: {
        value: 42
      }
    }
  })

  t.false(match({ items: { value: 42 } }))
  t.true(match({ items: [{ value: 42 }] }))
  t.false(match({ items: [{ value: 0 }] }))
  t.true(match({ items: [{ value: 0 }, { value: 42 }] }))
})

test('mql:mod', t => {
  const match = compile({
    'items.value': {
      $mod: [2, 0]
    }
  })

  t.false(match({ items: [{ value: 41 }] }))
  t.true(match({ items: [{ value: 42 }] }))
})

test('mql:all', t => {
  const match = compile({
    items: {
      $all: [2, 0]
    }
  })

  t.false(match({ items: [0, 1, 4] }))
  t.true(match({ items: [0, 1, 2, 3, 4] }))
})

test('mql:comment', t => {
  const match = compile({
    $comment: 'test'
  })
  t.true(match({}))
})

test('mql:empty', t => {
  const match = compile()
  t.true(match({}))
  t.false(match(new Date()))
})

test('mql:_id', async t => {
  const id = '507f191e810c19729de860ea'
  const match = compile({ _id: new ObjectId(id) })
  t.true(match({ _id: new ObjectId(id), value: 42 }))
  t.false(match({ _id: new ObjectId() }))
  t.false(match({ _id: null }))
  t.false(match({ _id: new Date() }))
})

test('mql:expression', async t => {
  t.throws(() => compile({ obj: { $eq: { value: 1 }, value: 1 } }))

  const document = { obj: { value: 1 } }

  const a = compile({ obj: { value: 1 } })
  t.true(a(document))

  const b = compile({ obj: { $eq: { value: 1 } } })
  t.true(b(document))
})

test('mql:elemMatch', async t => {
  const match = compile({
    items: {
      $elemMatch: {
        $eq: 42
      }
    }
  })

  t.true(match({ items: [42] }))
})
