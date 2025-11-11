import test from 'ava'

import {
  compileAggregationExpression,
  compileAggregationPipeline,
} from '../../exports.js'

function evalExpression(expression: unknown, document?: unknown): unknown {
  return compileAggregationExpression(expression)(document)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/and/
 */
test('$and', t => {
  // Behavior section
  t.is(evalExpression({ $and: [1, 'green'] }), true)
  t.is(evalExpression({ $and: [] }), true)
  t.is(evalExpression({ $and: [[null], [false], [0]] }), true)
  t.is(evalExpression({ $and: [null, true] }), false)
  t.is(evalExpression({ $and: [0, true] }), false)

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
          result: { $and: [{ $gt: ['$qty', 100] }, { $lt: ['$qty', 250] }] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc1', qty: 300, result: false },
      { _id: 2, item: 'abc2', qty: 200, result: true },
      { _id: 3, item: 'xyz1', qty: 250, result: false },
      { _id: 4, item: 'VWZ1', qty: 300, result: false },
      { _id: 5, item: 'VWZ2', qty: 180, result: true },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/not/
 */
test('$not', t => {
  // Behavior section
  t.is(evalExpression({ $not: [true] }), false)
  t.is(evalExpression({ $not: [[false]] }), false)
  t.is(evalExpression({ $not: [false] }), true)
  t.is(evalExpression({ $not: [null] }), true)
  t.is(evalExpression({ $not: [0] }), true)

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
          result: { $not: [{ $gt: ['$qty', 250] }] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc1', result: false },
      { _id: 2, item: 'abc2', result: true },
      { _id: 3, item: 'xyz1', result: true },
      { _id: 4, item: 'VWZ1', result: false },
      { _id: 5, item: 'VWZ2', result: true },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/or/
 */
test('$or', t => {
  // Behavior section
  t.is(evalExpression({ $or: [true, false] }), true)
  t.is(evalExpression({ $or: [[false], false] }), true)
  t.is(evalExpression({ $or: [null, 0, undefined] }), false)
  t.is(evalExpression({ $or: [] }), false)

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
          result: { $or: [{ $gt: ['$qty', 250] }, { $lt: ['$qty', 200] }] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc1', result: true },
      { _id: 2, item: 'abc2', result: false },
      { _id: 3, item: 'xyz1', result: false },
      { _id: 4, item: 'VWZ1', result: true },
      { _id: 5, item: 'VWZ2', result: true },
    ])
  }
})
