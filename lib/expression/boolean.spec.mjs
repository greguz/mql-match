import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$and', async t => {
  const documents = [
    { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
    { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
    { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
    { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
    { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        item: 1,
        qty: 1,
        result: { $and: [{ $gt: ['$qty', 100] }, { $lt: ['$qty', 250] }] }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, item: 'abc1', qty: 300, result: false },
      { _id: 2, item: 'abc2', qty: 200, result: true },
      { _id: 3, item: 'xyz1', qty: 250, result: false },
      { _id: 4, item: 'VWZ1', qty: 300, result: false },
      { _id: 5, item: 'VWZ2', qty: 180, result: true }
    ]
  )
})

test('expression:$or', async t => {
  const documents = [
    { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
    { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
    { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
    { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
    { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        item: 1,
        result: { $or: [{ $gt: ['$qty', 250] }, { $lt: ['$qty', 200] }] }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, item: 'abc1', result: true },
      { _id: 2, item: 'abc2', result: false },
      { _id: 3, item: 'xyz1', result: false },
      { _id: 4, item: 'VWZ1', result: true },
      { _id: 5, item: 'VWZ2', result: true }
    ]
  )
})

test('expression:$not', async t => {
  const documents = [
    { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
    { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
    { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
    { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
    { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        item: 1,
        result: { $not: [{ $gt: ['$qty', 250] }] }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, item: 'abc1', result: false },
      { _id: 2, item: 'abc2', result: true },
      { _id: 3, item: 'xyz1', result: true },
      { _id: 4, item: 'VWZ1', result: false },
      { _id: 5, item: 'VWZ2', result: true }
    ]
  )
})
