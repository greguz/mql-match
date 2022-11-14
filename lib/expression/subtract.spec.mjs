import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregate (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$subtract', async t => {
  const now = new Date()
  const documents = [
    { _id: 1, item: 'abc', price: 10, fee: 2, discount: 5, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, fee: 1, discount: 2, date: new Date('2014-03-01T09:00:00Z') }
  ]
  t.deepEqual(
    await aggregate(
      documents,
      [
        {
          $project: {
            item: 1,
            total: { $subtract: [{ $add: ['$price', '$fee'] }, '$discount'] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', total: 7 },
      { _id: 2, item: 'jkl', total: 19 }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      [
        {
          $project: {
            item: 1,
            dateDifference: { $subtract: [now, '$date'] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', dateDifference: now.getTime() - documents[0].date.getTime() },
      { _id: 2, item: 'jkl', dateDifference: now.getTime() - documents[1].date.getTime() }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      [
        {
          $project: {
            item: 1,
            dateDifference: { $subtract: ['$date', 5 * 60 * 1000] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', dateDifference: new Date('2014-03-01T07:55:00Z') },
      { _id: 2, item: 'jkl', dateDifference: new Date('2014-03-01T08:55:00Z') }
    ]
  )
})
