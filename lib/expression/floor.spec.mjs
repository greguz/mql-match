import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$floor', async t => {
  const documents = [
    { _id: 1, value: 9.25 },
    { _id: 2, value: 8.73 },
    { _id: 3, value: 4.32 },
    { _id: 4, value: -5.34 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { value: 1, floorValue: { $floor: '$value' } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, value: 9.25, floorValue: 9 },
      { _id: 2, value: 8.73, floorValue: 8 },
      { _id: 3, value: 4.32, floorValue: 4 },
      { _id: 4, value: -5.34, floorValue: -6 }
    ]
  )
})
