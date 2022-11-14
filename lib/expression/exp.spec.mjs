import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$exp', async t => {
  const documents = [
    { _id: 1, rate: 0.08, pv: 10000 },
    { _id: 2, rate: 0.0825, pv: 250000 },
    { _id: 3, rate: 0.0425, pv: 1000 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { effectiveRate: { $subtract: [{ $exp: '$rate' }, 1] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, effectiveRate: 0.0832870676749586 },
      { _id: 2, effectiveRate: 0.0859986734390565 },
      { _id: 3, effectiveRate: 0.043416056373678 }
    ]
  )
})
