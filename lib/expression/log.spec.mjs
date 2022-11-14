import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('expression:$log', async t => {
  const documents = [
    { _id: 1, positiveInt: 5 },
    { _id: 2, positiveInt: 2 },
    { _id: 3, positiveInt: 23 },
    { _id: 4, positiveInt: 10 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        bitsNeeded:
      { $floor: { $add: [1, { $log: ['$positiveInt', 2] }] } }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, bitsNeeded: 3 },
      { _id: 2, bitsNeeded: 2 },
      { _id: 3, bitsNeeded: 5 },
      { _id: 4, bitsNeeded: 4 }
    ]
  )
})

test('expression:$ln', async t => {
  const documents = [
    { _id: 1, year: '2000', sales: 8700000 },
    { _id: 2, year: '2005', sales: 5000000 },
    { _id: 3, year: '2010', sales: 6250000 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        x: '$year',
        y: { $ln: '$sales' }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, x: '2000', y: 15.978833583624812 },
      { _id: 2, x: '2005', y: 15.424948470398375 },
      { _id: 3, x: '2010', y: 15.648092021712584 }
    ]
  )
})

test('expression:$log10', async t => {
  const documents = [
    { _id: 1, H3O: 0.0025 },
    { _id: 2, H3O: 0.001 },
    { _id: 3, H3O: 0.02 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        pH: {
          $multiply: [-1, { $log10: '$H3O' }]
        }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, pH: 2.6020599913279625 },
      { _id: 2, pH: 3 },
      { _id: 3, pH: 1.6989700043360187 }
    ]
  )
})
