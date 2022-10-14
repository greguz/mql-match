import test from 'ava'

import { compileDeleter, compileReader, compileWriter } from './path.mjs'

function writeValue (subject, key, value) {
  const fn = compileWriter(key)
  fn(subject, value)
  return subject
}

function deleteValue (subject, key) {
  const fn = compileDeleter(key)
  fn(subject)
  return subject
}

test('write object defaults', t => {
  t.deepEqual(
    writeValue({}, 'a.b.c', 42),
    {
      a: {
        b: {
          c: 42
        }
      }
    }
  )
})

test('write array and object defaults', t => {
  t.deepEqual(
    writeValue({}, 'a.2.f', 42),
    {
      a: {
        2: {
          f: 42
        }
      }
    }
  )
})

test('write array', t => {
  t.deepEqual(
    writeValue({ a: [] }, 'a.2.f', 42),
    {
      a: [
        null,
        null,
        {
          f: 42
        }
      ]
    }
  )
})

test('write array bug', t => {
  t.deepEqual(
    writeValue({ a: [] }, 'a.2', 42),
    {
      a: [
        null,
        null,
        42
      ]
    }
  )
})

test('compileReader', t => {
  const readValue = compileReader('a.1.c')
  t.is(readValue({ a: { 1: { c: 42 } } }), 42)
  t.is(readValue({ a: [null, { c: 42 }] }), 42)
  t.is(readValue({ a: null }, undefined))
})

test('compileDeleter', t => {
  t.deepEqual(
    deleteValue({}, 'a'),
    {}
  )
  t.deepEqual(
    deleteValue({ a: 42 }, 'a'),
    {}
  )
  t.deepEqual(
    deleteValue({ x: 42 }, 'a.b.c'),
    { x: 42 }
  )
  t.deepEqual(
    deleteValue({ a: { b: { c: 42 } } }, 'a.b.c'),
    { a: { b: {} } }
  )
  t.deepEqual(
    deleteValue({ 1: true, x: 'Hello World' }, '1'),
    { x: 'Hello World' }
  )
  t.deepEqual(
    deleteValue({ arr: ['a', 'b', 'c'] }, 'arr.1'),
    { arr: ['a', null, 'c'] }
  )
  t.deepEqual(
    deleteValue({ arr: ['a', 'b'] }, 'arr.1'),
    { arr: ['a', null] } // TODO: pop?
  )
})
