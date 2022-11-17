import test from 'ava'

import { compileUpdateQuery } from '../updateQuery.mjs'

test('update:$addToSet', t => {
  const doc = { _id: 1, letters: ['a', 'b'] }
  const fn = compileUpdateQuery({ $addToSet: { letters: ['c', 'd'] } })
  fn(doc)
  t.deepEqual(doc, { _id: 1, letters: ['a', 'b', ['c', 'd']] })
})
