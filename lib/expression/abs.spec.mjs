import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$abs', async t => {
  const documents = [
    { _id: 1, start: 5, end: 8 },
    { _id: 2, start: 4, end: 4 },
    { _id: 3, start: 9, end: 7 },
    { _id: 4, start: 6, end: 7 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { delta: { $abs: { $subtract: ['$start', '$end'] } } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, delta: 3 },
      { _id: 2, delta: 0 },
      { _id: 3, delta: 2 },
      { _id: 4, delta: 1 }
    ]
  )
})
