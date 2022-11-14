import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregate (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$round', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, value: 10.5 },
        { _id: 2, value: 11.5 },
        { _id: 3, value: 12.5 },
        { _id: 4, value: 13.5 }
      ],
      [
        { $project: { value: { $round: ['$value', 0] } } }
      ]
    ),
    [
      { _id: 1, value: 10 },
      { _id: 2, value: 12 },
      { _id: 3, value: 12 },
      { _id: 4, value: 14 }
    ]
  )
  const samples = [
    { _id: 1, value: 19.25 },
    { _id: 2, value: 28.73 },
    { _id: 3, value: 34.32 },
    { _id: 4, value: -45.39 }
  ]
  t.deepEqual(
    await aggregate(
      samples,
      [
        { $project: { roundedValue: { $round: ['$value', 1] } } }
      ]
    ),
    [
      { _id: 1, roundedValue: 19.2 },
      { _id: 2, roundedValue: 28.7 },
      { _id: 3, roundedValue: 34.3 },
      { _id: 4, roundedValue: -45.4 }
    ]
  )
  // TODO: whaaat?
  // t.deepEqual(
  //   await aggregate(
  //     samples,
  //     { $project: { roundedValue: { $round: ['$value', -1] } } }
  //   ),
  //   [
  //     { _id: 1, roundedValue: 10 },
  //     { _id: 2, roundedValue: 20 },
  //     { _id: 3, roundedValue: 30 },
  //     { _id: 4, roundedValue: -50 }
  //   ]
  // )
  t.deepEqual(
    await aggregate(
      samples,
      [
        { $project: { roundedValue: { $round: ['$value', 0] } } }
      ]
    ),
    [
      { _id: 1, roundedValue: 19 },
      { _id: 2, roundedValue: 29 },
      { _id: 3, roundedValue: 34 },
      { _id: 4, roundedValue: -45 }
    ]
  )
})
