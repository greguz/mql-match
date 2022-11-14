import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$sqrt', async t => {
  const documents = [
    { _id: 1, p1: { x: 5, y: 8 }, p2: { x: 0, y: 5 } },
    { _id: 2, p1: { x: -2, y: 1 }, p2: { x: 1, y: 5 } },
    { _id: 3, p1: { x: 4, y: 4 }, p2: { x: 4, y: 0 } }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        distance: {
          $sqrt: {
            $add: [
              { $pow: [{ $subtract: ['$p2.y', '$p1.y'] }, 2] },
              { $pow: [{ $subtract: ['$p2.x', '$p1.x'] }, 2] }
            ]
          }
        }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, distance: 5.830951894845301 },
      { _id: 2, distance: 5 },
      { _id: 3, distance: 4 }
    ]
  )
})
