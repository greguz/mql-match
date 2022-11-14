import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregate (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$add', async t => {
  const documents = [
    { _id: 1, item: 'abc', price: 10, fee: 2, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, fee: 1, date: new Date('2014-03-01T09:00:00Z') },
    { _id: 3, item: 'xyz', price: 5, fee: 0, date: new Date('2014-03-15T09:00:00Z') }
  ]
  t.deepEqual(
    await aggregate(
      documents,
      [
        { $project: { item: 1, total: { $add: ['$price', '$fee'] } } }
      ]
    ),
    [
      { _id: 1, item: 'abc', total: 12 },
      { _id: 2, item: 'jkl', total: 21 },
      { _id: 3, item: 'xyz', total: 5 }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      [
        {
          $project: {
            item: 1,
            billing_date: { $add: ['$date', 3 * 24 * 60 * 60000] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', billing_date: new Date('2014-03-04T08:00:00Z') },
      { _id: 2, item: 'jkl', billing_date: new Date('2014-03-04T09:00:00Z') },
      { _id: 3, item: 'xyz', billing_date: new Date('2014-03-18T09:00:00Z') }
    ]
  )
})
