import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$cond', async t => {
  const documents = [
    { _id: 1, item: 'abc1', qty: 300 },
    { _id: 2, item: 'abc2', qty: 200 },
    { _id: 3, item: 'xyz1', qty: 250 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        item: 1,
        discount: {
          $cond: { if: { $gte: ['$qty', 250] }, then: 30, else: 20 }
        }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, item: 'abc1', discount: 30 },
      { _id: 2, item: 'abc2', discount: 20 },
      { _id: 3, item: 'xyz1', discount: 30 }
    ]
  )
})
