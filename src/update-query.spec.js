import test from 'ava'

import { compileUpdateQuery as compile } from './update-query.js'

test('mql:update-query', t => {
  const fn = compile({
    $set: {
      'a.2.c': 42
    },
    $inc: {
      'a.0.k': 42
    }
  })

  t.deepEqual(
    fn({}),
    {
      a: {
        0: {
          k: 42
        },
        2: {
          c: 42
        }
      }
    }
  )

  t.deepEqual(
    fn({
      a: [
        { k: -32 },
      ]
    }),
    {
      a: [
        { k: 10 },
        null,
        { c: 42 }
      ]
    }
  )
})
