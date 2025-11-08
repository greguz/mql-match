import test from 'ava'

import { compilePipeline } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLower/
 */
test('$toLower', t => {
  const docs = [
    { _id: 1, item: 'ABC1', quarter: '13Q1', description: 'PRODUCT 1' },
    { _id: 2, item: 'abc2', quarter: '13Q4', description: 'Product 2' },
    { _id: 3, item: 'xyz1', quarter: '14Q2', description: null },
  ]

  const aggregate = compilePipeline([
    {
      $project: {
        item: { $toLower: '$item' },
        description: { $toLower: '$description' },
      },
    },
  ])

  t.deepEqual(aggregate(docs), [
    { _id: 1, item: 'abc1', description: 'product 1' },
    { _id: 2, item: 'abc2', description: 'product 2' },
    { _id: 3, item: 'xyz1', description: '' },
  ])
})
