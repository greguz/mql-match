import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$concatArrays', async t => {
  const documents = [
    { _id: 1, instock: ['chocolate'], ordered: ['butter', 'apples'] },
    { _id: 2, instock: ['apples', 'pudding', 'pie'] },
    { _id: 3, instock: ['pears', 'pecans'], ordered: ['cherries'] },
    { _id: 4, instock: ['ice cream'], ordered: [] }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { items: { $concatArrays: ['$instock', '$ordered'] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, items: ['chocolate', 'butter', 'apples'] },
      { _id: 2, items: null },
      { _id: 3, items: ['pears', 'pecans', 'cherries'] },
      { _id: 4, items: ['ice cream'] }
    ]
  )
})
