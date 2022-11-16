import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregate (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$size', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, items: ['a', 'b'] },
        { _id: 2, items: [] },
        { _id: 3, items: ['c'] }
      ],
      [{ $project: { size: { $size: '$items' } } }]
    ),
    [
      { _id: 1, size: 2 },
      { _id: 2, size: 0 },
      { _id: 3, size: 1 }
    ]
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'ABC1', description: 'product 1', colors: ['blue', 'black', 'red'] },
        { _id: 2, item: 'ABC2', description: 'product 2', colors: ['purple'] },
        { _id: 3, item: 'XYZ1', description: 'product 3', colors: [] },
        { _id: 4, item: 'ZZZ1', description: 'product 4 - missing colors' },
        { _id: 5, item: 'ZZZ2', description: 'product 5 - colors is string', colors: 'blue,red' }
      ],
      [
        {
          $project: {
            item: 1,
            numberOfColors: { $cond: { if: { $isArray: '$colors' }, then: { $size: '$colors' }, else: 'NA' } }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'ABC1', numberOfColors: 3 },
      { _id: 2, item: 'ABC2', numberOfColors: 1 },
      { _id: 3, item: 'XYZ1', numberOfColors: 0 },
      { _id: 4, item: 'ZZZ1', numberOfColors: 'NA' },
      { _id: 5, item: 'ZZZ2', numberOfColors: 'NA' }
    ]
  )
})
