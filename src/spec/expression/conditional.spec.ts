import test from 'ava'

import { compileExpression, compilePipeline } from '../../exports.js'

function evalExpression(expr: unknown, doc?: unknown): unknown {
  return compileExpression(expr)(doc)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/
 */
test('$cond', t => {
  const docs = [
    { _id: 1, item: 'abc1', qty: 300 },
    { _id: 2, item: 'abc2', qty: 200 },
    { _id: 3, item: 'xyz1', qty: 250 },
  ]

  {
    const aggregate = compilePipeline([
      {
        $project: {
          item: 1,
          discount: {
            $cond: {
              if: { $gte: ['$qty', 250] },
              then: 30,
              else: 20,
            },
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc1', discount: 30 },
      { _id: 2, item: 'abc2', discount: 20 },
      { _id: 3, item: 'xyz1', discount: 30 },
    ])
  }

  {
    const aggregate = compilePipeline([
      {
        $project: {
          item: 1,
          discount: {
            $cond: [{ $gte: ['$qty', 250] }, 30, 20],
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc1', discount: 30 },
      { _id: 2, item: 'abc2', discount: 20 },
      { _id: 3, item: 'xyz1', discount: 30 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/
 */
test('$ifNull', t => {
  const docs = [
    { _id: 1, item: 'buggy', description: 'toy car', quantity: 300 },
    { _id: 2, item: 'bicycle', description: null, quantity: 200 },
    { _id: 3, item: 'flag' },
  ]

  {
    const aggregate = compilePipeline([
      {
        $project: {
          item: 1,
          description: { $ifNull: ['$description', 'Unspecified'] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'buggy', description: 'toy car' },
      { _id: 2, item: 'bicycle', description: 'Unspecified' },
      { _id: 3, item: 'flag', description: 'Unspecified' },
    ])
  }

  {
    const aggregate = compilePipeline([
      {
        $project: {
          item: 1,
          value: { $ifNull: ['$description', '$quantity', 'Unspecified'] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'buggy', value: 'toy car' },
      { _id: 2, item: 'bicycle', value: 200 },
      { _id: 3, item: 'flag', value: 'Unspecified' },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/switch/
 */
test('$switch', t => {
  t.is(
    evalExpression({
      $switch: {
        branches: [
          { case: { $eq: [0, 5] }, then: 'equals' },
          { case: { $gt: [0, 5] }, then: 'greater than' },
          { case: { $lt: [0, 5] }, then: 'less than' },
        ],
      },
    }),
    'less than',
  )
  t.is(
    evalExpression({
      $switch: {
        branches: [
          { case: { $eq: [0, 5] }, then: 'equals' },
          { case: { $gt: [0, 5] }, then: 'greater than' },
        ],
        default: 'did not match',
      },
    }),
    'did not match',
  )
  t.is(
    evalExpression({
      $switch: {
        branches: [
          { case: 'this is true', then: 'first case' },
          { case: false, then: 'second case' },
        ],
        default: 'did not match',
      },
    }),
    'first case',
  )

  {
    const docs = [
      { _id: 1, name: 'Susan Wilkes', scores: [87, 86, 78] },
      { _id: 2, name: 'Bob Hanna', scores: [71, 64, 81] },
      { _id: 3, name: 'James Torrelio', scores: [91, 84, 97] },
    ]

    const aggregate = compilePipeline([
      {
        $project: {
          name: 1,
          summary: {
            $switch: {
              branches: [
                {
                  case: { $gte: [{ $avg: '$scores' }, 90] },
                  then: 'Doing great!',
                },
                {
                  case: {
                    $and: [
                      { $gte: [{ $avg: '$scores' }, 80] },
                      { $lt: [{ $avg: '$scores' }, 90] },
                    ],
                  },
                  then: 'Doing pretty well.',
                },
                {
                  case: { $lt: [{ $avg: '$scores' }, 80] },
                  then: 'Needs improvement.',
                },
              ],
              default: 'No scores found.',
            },
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, name: 'Susan Wilkes', summary: 'Doing pretty well.' },
      { _id: 2, name: 'Bob Hanna', summary: 'Needs improvement.' },
      { _id: 3, name: 'James Torrelio', summary: 'Doing great!' },
    ])
  }
})
