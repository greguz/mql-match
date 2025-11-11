import test from 'ava'

import { compileAggregationPipeline } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/
 */
test('$cmp', t => {
  // Example section
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          cmpTo250: { $cmp: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, cmpTo250: 1 },
      { item: 'abc2', qty: 200, cmpTo250: -1 },
      { item: 'xyz1', qty: 250, cmpTo250: 0 },
      { item: 'VWZ1', qty: 300, cmpTo250: 1 },
      { item: 'VWZ2', qty: 180, cmpTo250: -1 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/
 */
test('$eq', t => {
  // Example section
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          qtyEq250: { $eq: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, qtyEq250: false },
      { item: 'abc2', qty: 200, qtyEq250: false },
      { item: 'xyz1', qty: 250, qtyEq250: true },
      { item: 'VWZ1', qty: 300, qtyEq250: false },
      { item: 'VWZ2', qty: 180, qtyEq250: false },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gt/
 */
test('$gt', t => {
  // Example section
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          qtyGt250: { $gt: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, qtyGt250: true },
      { item: 'abc2', qty: 200, qtyGt250: false },
      { item: 'xyz1', qty: 250, qtyGt250: false },
      { item: 'VWZ1', qty: 300, qtyGt250: true },
      { item: 'VWZ2', qty: 180, qtyGt250: false },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/gte/
 */
test('$gte', t => {
  // Example section
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          qtyGte250: { $gte: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, qtyGte250: true },
      { item: 'abc2', qty: 200, qtyGte250: false },
      { item: 'xyz1', qty: 250, qtyGte250: true },
      { item: 'VWZ1', qty: 300, qtyGte250: true },
      { item: 'VWZ2', qty: 180, qtyGte250: false },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lt/
 */
test('$lt', t => {
  // Example section
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          qtyLt250: { $lt: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, qtyLt250: false },
      { item: 'abc2', qty: 200, qtyLt250: true },
      { item: 'xyz1', qty: 250, qtyLt250: false },
      { item: 'VWZ1', qty: 300, qtyLt250: false },
      { item: 'VWZ2', qty: 180, qtyLt250: true },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/lte/
 */
test('$lte', t => {
  // Example section
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          qtyLte250: { $lte: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, qtyLte250: false },
      { item: 'abc2', qty: 200, qtyLte250: true },
      { item: 'xyz1', qty: 250, qtyLte250: true },
      { item: 'VWZ1', qty: 300, qtyLte250: false },
      { item: 'VWZ2', qty: 180, qtyLte250: true },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/
 */
test('$ne', t => {
  {
    const docs = [
      { _id: 1, item: 'abc1', description: 'product 1', qty: 300 },
      { _id: 2, item: 'abc2', description: 'product 2', qty: 200 },
      { _id: 3, item: 'xyz1', description: 'product 3', qty: 250 },
      { _id: 4, item: 'VWZ1', description: 'product 4', qty: 300 },
      { _id: 5, item: 'VWZ2', description: 'product 5', qty: 180 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          qty: 1,
          qtyNe250: { $ne: ['$qty', 250] },
          _id: 0,
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { item: 'abc1', qty: 300, qtyNe250: true },
      { item: 'abc2', qty: 200, qtyNe250: true },
      { item: 'xyz1', qty: 250, qtyNe250: false },
      { item: 'VWZ1', qty: 300, qtyNe250: true },
      { item: 'VWZ2', qty: 180, qtyNe250: true },
    ])
  }
})
