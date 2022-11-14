import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$multiply', async t => {
  const documents = [
    { _id: 1, item: 'abc', price: 10, quantity: 2, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, quantity: 1, date: new Date('2014-03-01T09:00:00Z') },
    { _id: 3, item: 'xyz', price: 5, quantity: 10, date: new Date('2014-03-15T09:00:00Z') }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        date: 1,
        item: 1,
        total: { $multiply: ['$price', '$quantity'] }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, item: 'abc', date: new Date('2014-03-01T08:00:00Z'), total: 20 },
      { _id: 2, item: 'jkl', date: new Date('2014-03-01T09:00:00Z'), total: 20 },
      { _id: 3, item: 'xyz', date: new Date('2014-03-15T09:00:00Z'), total: 50 }
    ]
  )
})
