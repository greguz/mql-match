import test from 'ava'

import { compileUpdateQuery as compile } from './update-query.mjs'

test('mql:update-query', t => {
  const fn = compile({
    $set: {
      'a.2.c': 42
    },
    $inc: {
      'a.0.k': 42
    },
    $mul: {
      m: 2
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
      },
      m: 0
    }
  )

  t.deepEqual(
    fn({
      a: [
        { k: -32 }
      ],
      m: 2
    }),
    {
      a: [
        { k: 10 },
        null,
        { c: 42 }
      ],
      m: 4
    }
  )
})
