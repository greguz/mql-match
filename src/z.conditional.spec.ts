import test from 'ava'

import {
  compileAggregationExpression,
  compileAggregationPipeline,
} from './exports.js'

function aggregateArray(
  documents: unknown[],
  stages: Array<Record<string, unknown>>,
) {
  const fn = compileAggregationPipeline(stages)
  return fn(documents)
}

function expession(expression: unknown, doc: unknown = {}) {
  return compileAggregationExpression(expression)(doc)
}

test('$ifNull', t => {
  const documents = [
    { _id: 1, item: 'buggy', description: 'toy car', quantity: 300 },
    { _id: 2, item: 'bicycle', description: null, quantity: 200 },
    { _id: 3, item: 'flag' },
  ]
  t.deepEqual(
    aggregateArray(documents, [
      {
        $project: {
          item: 1,
          description: { $ifNull: ['$description', 'Unspecified'] },
        },
      },
    ]),
    [
      { _id: 1, item: 'buggy', description: 'toy car' },
      { _id: 2, item: 'bicycle', description: 'Unspecified' },
      { _id: 3, item: 'flag', description: 'Unspecified' },
    ],
  )
  t.deepEqual(
    aggregateArray(documents, [
      {
        $project: {
          item: 1,
          value: { $ifNull: ['$description', '$quantity', 'Unspecified'] },
        },
      },
    ]),
    [
      { _id: 1, item: 'buggy', value: 'toy car' },
      { _id: 2, item: 'bicycle', value: 200 },
      { _id: 3, item: 'flag', value: 'Unspecified' },
    ],
  )
})

test('$switch', t => {
  t.is(
    expession({
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
    expession({
      $switch: {
        branches: [
          { case: { $eq: [0, 5] }, then: 'equals' },
          { case: { $gt: [0, 5] }, then: 'greater than' },
        ],
        default: 'Did not match',
      },
    }),
    'Did not match',
  )
  t.is(
    expession({
      $switch: {
        branches: [
          { case: 'this is true', then: 'first case' },
          { case: false, then: 'second case' },
        ],
        default: 'Did not match',
      },
    }),
    'first case',
  )

  // const documents = [
  //   { _id: 1, name: 'Susan Wilkes', scores: [87, 86, 78] },
  //   { _id: 2, name: 'Bob Hanna', scores: [71, 64, 81] },
  //   { _id: 3, name: 'James Torrelio', scores: [91, 84, 97] }
  // ]

  // const aggregate = compileAggregationPipeline([
  //   {
  //     $project: {
  //       name: 1,
  //       summary: {
  //         $switch: {
  //           branches: [
  //             {
  //               case: { $gte: [{ $avg: '$scores' }, 90] },
  //               then: 'Doing great!'
  //             },
  //             {
  //               case: {
  //                 $and: [
  //                   { $gte: [{ $avg: '$scores' }, 80] },
  //                   { $lt: [{ $avg: '$scores' }, 90] }
  //                 ]
  //               },
  //               then: 'Doing pretty well.'
  //             },
  //             {
  //               case: { $lt: [{ $avg: '$scores' }, 80] },
  //               then: 'Needs improvement.'
  //             }
  //           ],
  //           default: 'No scores found.'
  //         }
  //       }
  //     }
  //   }
  // ])

  // t.deepEqual(
  //   await toArray(aggregate(documents)),
  //   [
  //     { _id: 1, name: 'Susan Wilkes', summary: 'Doing pretty well.' },
  //     { _id: 2, name: 'Bob Hanna', summary: 'Needs improvement.' },
  //     { _id: 3, name: 'James Torrelio', summary: 'Doing great!' }
  //   ]
  // )
})

test('$cond', t => {
  const documents = [
    { _id: 1, item: 'abc1', qty: 300 },
    { _id: 2, item: 'abc2', qty: 200 },
    { _id: 3, item: 'xyz1', qty: 250 },
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        item: 1,
        discount: {
          $cond: { if: { $gte: ['$qty', 250] }, then: 30, else: 20 },
        },
      },
    },
  ])

  t.deepEqual(aggregate(documents), [
    { _id: 1, item: 'abc1', discount: 30 },
    { _id: 2, item: 'abc2', discount: 20 },
    { _id: 3, item: 'xyz1', discount: 30 },
  ])
})
