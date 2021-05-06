import test from 'ava'

import { compile } from './mql-match.js'

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
