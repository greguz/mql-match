import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$gt', async t => {
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
        qtyGt250: { $gt: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, qtyGt250: true },
      { item: 'abc2', qty: 200, qtyGt250: false },
      { item: 'xyz1', qty: 250, qtyGt250: false },
      { item: 'VWZ1', qty: 300, qtyGt250: true },
      { item: 'VWZ2', qty: 180, qtyGt250: false }
    ]
  )
})

test('expression:$gte', async t => {
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
        qtyGte250: { $gte: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, qtyGte250: true },
      { item: 'abc2', qty: 200, qtyGte250: false },
      { item: 'xyz1', qty: 250, qtyGte250: true },
      { item: 'VWZ1', qty: 300, qtyGte250: true },
      { item: 'VWZ2', qty: 180, qtyGte250: false }
    ]
  )
})

test('expression:$lt', async t => {
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
        qtyLt250: { $lt: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, qtyLt250: false },
      { item: 'abc2', qty: 200, qtyLt250: true },
      { item: 'xyz1', qty: 250, qtyLt250: false },
      { item: 'VWZ1', qty: 300, qtyLt250: false },
      { item: 'VWZ2', qty: 180, qtyLt250: true }
    ]
  )
})

test('expression:$lte', async t => {
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
        qtyLte250: { $lte: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, qtyLte250: false },
      { item: 'abc2', qty: 200, qtyLte250: true },
      { item: 'xyz1', qty: 250, qtyLte250: true },
      { item: 'VWZ1', qty: 300, qtyLte250: false },
      { item: 'VWZ2', qty: 180, qtyLte250: true }
    ]
  )
})

test('expression:$eq', async t => {
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
        qtyEq250: { $eq: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, qtyEq250: false },
      { item: 'abc2', qty: 200, qtyEq250: false },
      { item: 'xyz1', qty: 250, qtyEq250: true },
      { item: 'VWZ1', qty: 300, qtyEq250: false },
      { item: 'VWZ2', qty: 180, qtyEq250: false }
    ]
  )
})

test('expression:$ne', async t => {
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
        qtyNe250: { $ne: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, qtyNe250: true },
      { item: 'abc2', qty: 200, qtyNe250: true },
      { item: 'xyz1', qty: 250, qtyNe250: false },
      { item: 'VWZ1', qty: 300, qtyNe250: true },
      { item: 'VWZ2', qty: 180, qtyNe250: true }
    ]
  )
})

test('expression:$cmp', async t => {
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
        cmpTo250: { $cmp: ['$qty', 250] },
        _id: 0
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { item: 'abc1', qty: 300, cmpTo250: 1 },
      { item: 'abc2', qty: 200, cmpTo250: -1 },
      { item: 'xyz1', qty: 250, cmpTo250: 0 },
      { item: 'VWZ1', qty: 300, cmpTo250: 1 },
      { item: 'VWZ2', qty: 180, cmpTo250: -1 }
    ]
  )
})
