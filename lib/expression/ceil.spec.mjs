import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$ceil', async t => {
  const documents = [
    { _id: 1, value: 9.25 },
    { _id: 2, value: 8.73 },
    { _id: 3, value: 4.32 },
    { _id: 4, value: -5.34 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { value: 1, ceilingValue: { $ceil: '$value' } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, value: 9.25, ceilingValue: 10 },
      { _id: 2, value: 8.73, ceilingValue: 9 },
      { _id: 3, value: 4.32, ceilingValue: 5 },
      { _id: 4, value: -5.34, ceilingValue: -5 }
    ]
  )
})
