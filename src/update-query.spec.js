import test from 'ava'

import { compileUpdateQuery as compile } from './update-query'

test('mql:double-negation', t => {
  const fn = compile({
    $set: {
      'a.2.c': 42
    }
  })

  t.deepEqual(
    fn({}),
    {
      a: {
        2: {
          c: 42
        }
      }
    }
  )

  t.deepEqual(
    fn({
      a: [
        true
      ]
    }),
    {
      a: [
        true,
        null,
        { c: 42 }
      ]
    }
  )
})
