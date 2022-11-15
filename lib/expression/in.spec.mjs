import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$in', async t => {
  const documents = [
    {
      _id: 1,
      location: '24th Street',
      in_stock: ['apples', 'oranges', 'bananas']
    },
    {
      _id: 2,
      location: '36th Street',
      in_stock: ['bananas', 'pears', 'grapes']
    },
    {
      _id: 3,
      location: '82nd Street',
      in_stock: ['cantaloupes', 'watermelons', 'apples']
    }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        'store location': '$location',
        'has bananas': {
          $in: ['bananas', '$in_stock']
        }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, 'store location': '24th Street', 'has bananas': true },
      { _id: 2, 'store location': '36th Street', 'has bananas': true },
      { _id: 3, 'store location': '82nd Street', 'has bananas': false }
    ]
  )
})
