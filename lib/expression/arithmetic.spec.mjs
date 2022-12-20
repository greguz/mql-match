import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

function aggregateArray (documents, stages) {
  const fn = compileAggregationPipeline(stages)
  return toArray(fn(documents))
}

test('expression:$abs', async t => {
  const documents = [
    { _id: 1, start: 5, end: 8 },
    { _id: 2, start: 4, end: 4 },
    { _id: 3, start: 9, end: 7 },
    { _id: 4, start: 6, end: 7 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { delta: { $abs: { $subtract: ['$start', '$end'] } } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, delta: 3 },
      { _id: 2, delta: 0 },
      { _id: 3, delta: 2 },
      { _id: 4, delta: 1 }
    ]
  )
})

test('expression:$ceil', async t => {
  const documents = [
    { _id: 1, value: 9.25 },
    { _id: 2, value: 8.73 },
    { _id: 3, value: 4.32 },
    { _id: 4, value: -5.34 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { value: 1, ceilingValue: { $ceil: '$value' } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, value: 9.25, ceilingValue: 10 },
      { _id: 2, value: 8.73, ceilingValue: 9 },
      { _id: 3, value: 4.32, ceilingValue: 5 },
      { _id: 4, value: -5.34, ceilingValue: -5 }
    ]
  )
})

test('expression:$sqrt', async t => {
  const documents = [
    { _id: 1, p1: { x: 5, y: 8 }, p2: { x: 0, y: 5 } },
    { _id: 2, p1: { x: -2, y: 1 }, p2: { x: 1, y: 5 } },
    { _id: 3, p1: { x: 4, y: 4 }, p2: { x: 4, y: 0 } }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        distance: {
          $sqrt: {
            $add: [
              { $pow: [{ $subtract: ['$p2.y', '$p1.y'] }, 2] },
              { $pow: [{ $subtract: ['$p2.x', '$p1.x'] }, 2] }
            ]
          }
        }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, distance: 5.830951894845301 },
      { _id: 2, distance: 5 },
      { _id: 3, distance: 4 }
    ]
  )
})

test('expression:$exp', async t => {
  const documents = [
    { _id: 1, rate: 0.08, pv: 10000 },
    { _id: 2, rate: 0.0825, pv: 250000 },
    { _id: 3, rate: 0.0425, pv: 1000 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { effectiveRate: { $subtract: [{ $exp: '$rate' }, 1] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, effectiveRate: 0.0832870676749586 },
      { _id: 2, effectiveRate: 0.0859986734390565 },
      { _id: 3, effectiveRate: 0.043416056373678 }
    ]
  )
})

test('expression:$add', async t => {
  const documents = [
    { _id: 1, item: 'abc', price: 10, fee: 2, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, fee: 1, date: new Date('2014-03-01T09:00:00Z') },
    { _id: 3, item: 'xyz', price: 5, fee: 0, date: new Date('2014-03-15T09:00:00Z') }
  ]

  const a = compileAggregationPipeline([
    { $project: { item: 1, total: { $add: ['$price', '$fee'] } } }
  ])
  t.deepEqual(
    await toArray(a(documents)),
    [
      { _id: 1, item: 'abc', total: 12 },
      { _id: 2, item: 'jkl', total: 21 },
      { _id: 3, item: 'xyz', total: 5 }
    ]
  )

  const b = compileAggregationPipeline([
    {
      $project: {
        item: 1,
        billing_date: { $add: ['$date', 3 * 24 * 60 * 60000] }
      }
    }
  ])
  t.deepEqual(
    await toArray(b(documents)),
    [
      { _id: 1, item: 'abc', billing_date: new Date('2014-03-04T08:00:00Z') },
      { _id: 2, item: 'jkl', billing_date: new Date('2014-03-04T09:00:00Z') },
      { _id: 3, item: 'xyz', billing_date: new Date('2014-03-18T09:00:00Z') }
    ]
  )
})

test('expression:$divide', async t => {
  const documents = [
    { _id: 1, name: 'A', hours: 80, resources: 7 },
    { _id: 2, name: 'B', hours: 40, resources: 4 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { name: 1, workdays: { $divide: ['$hours', 8] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, name: 'A', workdays: 10 },
      { _id: 2, name: 'B', workdays: 5 }
    ]
  )
})

test('expression:$multiply', async t => {
  const documents = [
    { _id: 1, item: 'abc', price: 10, quantity: 2, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, quantity: 1, date: new Date('2014-03-01T09:00:00Z') },
    { _id: 3, item: 'xyz', price: 5, quantity: 10, date: new Date('2014-03-15T09:00:00Z') }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        date: 1,
        item: 1,
        total: { $multiply: ['$price', '$quantity'] }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, item: 'abc', date: new Date('2014-03-01T08:00:00Z'), total: 20 },
      { _id: 2, item: 'jkl', date: new Date('2014-03-01T09:00:00Z'), total: 20 },
      { _id: 3, item: 'xyz', date: new Date('2014-03-15T09:00:00Z'), total: 50 }
    ]
  )
})

test('expression:$subtract', async t => {
  const now = new Date()
  const documents = [
    { _id: 1, item: 'abc', price: 10, fee: 2, discount: 5, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, fee: 1, discount: 2, date: new Date('2014-03-01T09:00:00Z') }
  ]
  t.deepEqual(
    await aggregateArray(
      documents,
      [
        {
          $project: {
            item: 1,
            total: { $subtract: [{ $add: ['$price', '$fee'] }, '$discount'] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', total: 7 },
      { _id: 2, item: 'jkl', total: 19 }
    ]
  )
  t.deepEqual(
    await aggregateArray(
      documents,
      [
        {
          $project: {
            item: 1,
            dateDifference: { $subtract: [now, '$date'] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', dateDifference: now.getTime() - documents[0].date.getTime() },
      { _id: 2, item: 'jkl', dateDifference: now.getTime() - documents[1].date.getTime() }
    ]
  )
  t.deepEqual(
    await aggregateArray(
      documents,
      [
        {
          $project: {
            item: 1,
            dateDifference: { $subtract: ['$date', 5 * 60 * 1000] }
          }
        }
      ]
    ),
    [
      { _id: 1, item: 'abc', dateDifference: new Date('2014-03-01T07:55:00Z') },
      { _id: 2, item: 'jkl', dateDifference: new Date('2014-03-01T08:55:00Z') }
    ]
  )
})

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

test('expression:$floor', async t => {
  const documents = [
    { _id: 1, value: 9.25 },
    { _id: 2, value: 8.73 },
    { _id: 3, value: 4.32 },
    { _id: 4, value: -5.34 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { value: 1, floorValue: { $floor: '$value' } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, value: 9.25, floorValue: 9 },
      { _id: 2, value: 8.73, floorValue: 8 },
      { _id: 3, value: 4.32, floorValue: 4 },
      { _id: 4, value: -5.34, floorValue: -6 }
    ]
  )
})

test('expression:$trunc', async t => {
  const documents = [
    { _id: 1, value: 19.25 },
    { _id: 2, value: 28.73 },
    { _id: 3, value: 34.32 },
    { _id: 4, value: -45.34 }
  ]
  t.deepEqual(
    await aggregateArray(documents, [
      { $project: { truncatedValue: { $trunc: ['$value', 1] } } }
    ]),
    [
      { _id: 1, truncatedValue: 19.2 },
      { _id: 2, truncatedValue: 28.7 },
      { _id: 3, truncatedValue: 34.3 },
      { _id: 4, truncatedValue: -45.3 }
    ]
  )
  t.deepEqual(
    await aggregateArray(documents, [
      { $project: { truncatedValue: { $trunc: ['$value', -1] } } }
    ]),
    [
      { _id: 1, truncatedValue: 10 },
      { _id: 2, truncatedValue: 20 },
      { _id: 3, truncatedValue: 30 },
      { _id: 4, truncatedValue: -40 }
    ]
  )
  t.deepEqual(
    await aggregateArray(documents, [
      { $project: { truncatedValue: { $trunc: ['$value', 0] } } }
    ]),
    [
      { _id: 1, truncatedValue: 19 },
      { _id: 2, truncatedValue: 28 },
      { _id: 3, truncatedValue: 34 },
      { _id: 4, truncatedValue: -45 }
    ]
  )
})

test('expression:$mod', async t => {
  const documents = [
    { _id: 1, project: 'A', hours: 80, tasks: 7 },
    { _id: 2, project: 'B', hours: 40, tasks: 4 }
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { remainder: { $mod: ['$hours', '$tasks'] } } }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 1, remainder: 3 },
      { _id: 2, remainder: 0 }
    ]
  )
})

test('expression:$round', async t => {
  t.deepEqual(
    await aggregateArray(
      [
        { _id: 1, value: 10.5 },
        { _id: 2, value: 11.5 },
        { _id: 3, value: 12.5 },
        { _id: 4, value: 13.5 }
      ],
      [
        { $project: { value: { $round: ['$value', 0] } } }
      ]
    ),
    [
      { _id: 1, value: 10 },
      { _id: 2, value: 12 },
      { _id: 3, value: 12 },
      { _id: 4, value: 14 }
    ]
  )
  const samples = [
    { _id: 1, value: 19.25 },
    { _id: 2, value: 28.73 },
    { _id: 3, value: 34.32 },
    { _id: 4, value: -45.39 }
  ]
  t.deepEqual(
    await aggregateArray(
      samples,
      [{ $project: { roundedValue: { $round: ['$value', 1] } } }]
    ),
    [
      { _id: 1, roundedValue: 19.2 },
      { _id: 2, roundedValue: 28.7 },
      { _id: 3, roundedValue: 34.3 },
      { _id: 4, roundedValue: -45.4 }
    ]
  )
  t.deepEqual(
    await aggregateArray(
      samples,
      [{ $project: { roundedValue: { $round: ['$value', -1] } } }]
    ),
    [
      { _id: 1, roundedValue: 10 },
      { _id: 2, roundedValue: 20 },
      { _id: 3, roundedValue: 30 },
      { _id: 4, roundedValue: -40 }
    ]
  )
  t.deepEqual(
    await aggregateArray(
      samples,
      [
        { $project: { roundedValue: { $round: ['$value', 0] } } }
      ]
    ),
    [
      { _id: 1, roundedValue: 19 },
      { _id: 2, roundedValue: 29 },
      { _id: 3, roundedValue: 34 },
      { _id: 4, roundedValue: -45 }
    ]
  )
})
