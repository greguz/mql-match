import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregate (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$ifNull', async t => {
  const documents = [
    { _id: 1, item: 'buggy', description: 'toy car', quantity: 300 },
    { _id: 2, item: 'bicycle', description: null, quantity: 200 },
    { _id: 3, item: 'flag' }
  ]
  t.deepEqual(
    await aggregate(
      documents,
      [
        {
          $project: {
            item: 1,
            description: { $ifNull: ['$description', 'Unspecified'] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'buggy', description: 'toy car' },
      { _id: 2, item: 'bicycle', description: 'Unspecified' },
      { _id: 3, item: 'flag', description: 'Unspecified' }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      [
        {
          $project: {
            item: 1,
            value: { $ifNull: ['$description', '$quantity', 'Unspecified'] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'buggy', value: 'toy car' },
      { _id: 2, item: 'bicycle', value: 200 },
      { _id: 3, item: 'flag', value: 'Unspecified' }
    ]
  )
})
