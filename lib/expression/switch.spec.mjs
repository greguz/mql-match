import test from 'ava'

import { compileAggregationExpression } from '../aggregationExpression.mjs'
// import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
// import { toArray } from '../util.mjs'

function expession (expression, doc = {}) {
  return compileAggregationExpression(expression)(doc)
}

test('expression:$switch', async t => {
  t.is(
    expession({
      $switch: {
        branches: [
          { case: { $eq: [0, 5] }, then: 'equals' },
          { case: { $gt: [0, 5] }, then: 'greater than' },
          { case: { $lt: [0, 5] }, then: 'less than' }
        ]
      }
    }),
    'less than'
  )
  t.is(
    expession({
      $switch: {
        branches: [
          { case: { $eq: [0, 5] }, then: 'equals' },
          { case: { $gt: [0, 5] }, then: 'greater than' }
        ],
        default: 'Did not match'
      }
    }),
    'Did not match'
  )
  t.is(
    expession({
      $switch: {
        branches: [
          { case: 'this is true', then: 'first case' },
          { case: false, then: 'second case' }
        ],
        default: 'Did not match'
      }
    }),
    'first case'
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
