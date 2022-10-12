import test from 'ava'

import { parsePath, writeValue } from './path.mjs'

test('write object defaults', t => {
  t.deepEqual(
    writeValue({}, parsePath('a.b.c'), 42),
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
    writeValue({}, parsePath('a.2.f'), 42),
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
    writeValue({ a: [] }, parsePath('a.2.f'), 42),
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
    writeValue({ a: [] }, parsePath('a.2'), 42),
    {
      a: [
        null,
        null,
        42
      ]
    }
  )
})
