import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregate (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$trunc', async t => {
  const documents = [
    { _id: 1, value: 19.25 },
    { _id: 2, value: 28.73 },
    { _id: 3, value: 34.32 },
    { _id: 4, value: -45.34 }
  ]
  t.deepEqual(
    await aggregate(documents, [
      { $project: { truncatedValue: { $trunc: ['$value', 1] } } }
    ]),
    [
      { _id: 1, truncatedValue: 19.2 },
      { _id: 2, truncatedValue: 28.7 },
      { _id: 3, truncatedValue: 34.3 },
      { _id: 4, truncatedValue: -45.3 }
    ]
  )
  t.deepEqual(
    await aggregate(documents, [
      { $project: { truncatedValue: { $trunc: ['$value', -1] } } }
    ]),
    [
      { _id: 1, truncatedValue: 10 },
      { _id: 2, truncatedValue: 20 },
      { _id: 3, truncatedValue: 30 },
      { _id: 4, truncatedValue: -40 }
    ]
  )
  t.deepEqual(
    await aggregate(documents, [
      { $project: { truncatedValue: { $trunc: ['$value', 0] } } }
    ]),
    [
      { _id: 1, truncatedValue: 19 },
      { _id: 2, truncatedValue: 28 },
      { _id: 3, truncatedValue: 34 },
      { _id: 4, truncatedValue: -45 }
    ]
  )
})
