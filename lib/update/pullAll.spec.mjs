import test from 'ava'

import { compileUpdateQuery } from '../updateQuery.mjs'

test('update:$pullAll', t => {
  const doc = { _id: 1, scores: [0, 2, 5, 5, 1, 0] }
  const update = compileUpdateQuery({ $pullAll: { scores: [0, 5] } })
  update(doc)
  t.deepEqual(doc, { _id: 1, scores: [2, 1] })
})
