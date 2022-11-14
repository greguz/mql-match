import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$divide', async t => {
  const documents = [
    { _id: 1, name: 'A', hours: 80, resources: 7 },
    { _id: 2, name: 'B', hours: 40, resources: 4 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { name: 1, workdays: { $divide: ['$hours', 8] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, name: 'A', workdays: 10 },
      { _id: 2, name: 'B', workdays: 5 }
    ]
  )
})
