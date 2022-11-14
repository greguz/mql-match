import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$mod', async t => {
  const documents = [
    { _id: 1, project: 'A', hours: 80, tasks: 7 },
    { _id: 2, project: 'B', hours: 40, tasks: 4 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { remainder: { $mod: ['$hours', '$tasks'] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, remainder: 3 },
      { _id: 2, remainder: 0 }
    ]
  )
})
