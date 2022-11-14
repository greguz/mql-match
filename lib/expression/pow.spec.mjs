import test from 'ava'

// import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
// import { toArray } from '../util.mjs'

test('expression:$pow', async t => {
  // TODO
  t.pass()
  // const documents = [
  //   {
  //     _id: 1,
  //     scores: [
  //       {
  //         name: 'dave123',
  //         score: 85
  //       },
  //       {
  //         name: 'dave2',
  //         score: 90
  //       },
  //       {
  //         name: 'ahn',
  //         score: 71
  //       }
  //     ]
  //   },
  //   {
  //     _id: 2,
  //     scores: [
  //       {
  //         name: 'li',
  //         quiz: 2,
  //         score: 96
  //       },
  //       {
  //         name: 'annT',
  //         score: 77
  //       },
  //       {
  //         name: 'ty',
  //         score: 82
  //       }
  //     ]
  //   }
  // ]

  // const aggregate = compileAggregationPipeline([
  //   { $project: { variance: { $pow: [{ $stdDevPop: '$scores.score' }, 2] } } }
  // ])

  // t.deepEqual(
  //   await toArray(aggregate(documents)),
  //   [
  //     { _id: 1, variance: 64.66666666666667 },
  //     { _id: 2, variance: 64.66666666666667 }
  //   ]
  // )
})
