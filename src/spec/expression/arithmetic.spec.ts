import test from 'ava'

import {
  compileAggregationExpression,
  compileAggregationPipeline,
} from '../../exports.js'

function evalExpression(expr: unknown, doc?: unknown): unknown {
  return compileAggregationExpression(expr)(doc)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/abs/
 */
test('$abs', t => {
  // Behavior section
  t.is(evalExpression({ $abs: -1 }), 1)
  t.is(evalExpression({ $abs: 1 }), 1)
  t.is(evalExpression({ $abs: null }), null)

  // Example section
  {
    const docs = [
      { _id: 1, startTemp: 50, endTemp: 80 },
      { _id: 2, startTemp: 40, endTemp: 40 },
      { _id: 3, startTemp: 90, endTemp: 70 },
      { _id: 4, startTemp: 60, endTemp: 70 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          delta: {
            $abs: {
              $subtract: ['$startTemp', '$endTemp'],
            },
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, delta: 30 },
      { _id: 2, delta: 0 },
      { _id: 3, delta: 20 },
      { _id: 4, delta: 10 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/add/
 */
test('$add', t => {
  const docs = [
    {
      _id: 1,
      item: 'abc',
      price: 10,
      fee: 2,
      date: new Date('2014-03-01T08:00:00Z'),
    },
    {
      _id: 2,
      item: 'jkl',
      price: 20,
      fee: 1,
      date: new Date('2014-03-01T09:00:00Z'),
    },
    {
      _id: 3,
      item: 'xyz',
      price: 5,
      fee: 0,
      date: new Date('2014-03-15T09:00:00Z'),
    },
  ]

  // Add Numbers
  {
    const aggregate = compileAggregationPipeline([
      { $project: { item: 1, total: { $add: ['$price', '$fee'] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc', total: 12 },
      { _id: 2, item: 'jkl', total: 21 },
      { _id: 3, item: 'xyz', total: 5 },
    ])
  }

  // Perform Addition on a Date
  {
    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          billing_date: { $add: ['$date', 3 * 24 * 60 * 60000] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc', billing_date: new Date('2014-03-04T08:00:00Z') },
      { _id: 2, item: 'jkl', billing_date: new Date('2014-03-04T09:00:00Z') },
      { _id: 3, item: 'xyz', billing_date: new Date('2014-03-18T09:00:00Z') },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/
 */
test('$ceil', t => {
  // Behavior section
  t.is(evalExpression({ $ceil: 1 }), 1)
  t.is(evalExpression({ $ceil: 7.8 }), 8)
  t.is(evalExpression({ $ceil: -2.8 }), -2)

  // Example section
  {
    const docs = [
      { _id: 1, value: 9.25 },
      { _id: 2, value: 8.73 },
      { _id: 3, value: 4.32 },
      { _id: 4, value: -5.34 },
    ]

    const aggregate = compileAggregationPipeline([
      { $project: { value: 1, ceilingValue: { $ceil: '$value' } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, value: 9.25, ceilingValue: 10 },
      { _id: 2, value: 8.73, ceilingValue: 9 },
      { _id: 3, value: 4.32, ceilingValue: 5 },
      { _id: 4, value: -5.34, ceilingValue: -5 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/
 */
test('$divide', t => {
  const docs = [
    { _id: 1, city: 'New York', hours: 80, tasks: 7 },
    { _id: 2, city: 'Singapore', hours: 40, tasks: 4 },
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { city: 1, workdays: { $divide: ['$hours', 8] } } },
  ])

  t.deepEqual(aggregate(docs), [
    { _id: 1, city: 'New York', workdays: 10 },
    { _id: 2, city: 'Singapore', workdays: 5 },
  ])
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/
 */
test('$exp', t => {
  // Behavior section
  t.is(evalExpression({ $exp: 0 }), 1)
  t.is(evalExpression({ $exp: 2 }), 7.38905609893065)
  t.is(evalExpression({ $exp: -2 }), 0.1353352832366127)

  // Example section
  {
    const docs = [
      { _id: 1, interestRate: 0.08, presentValue: 10000 },
      { _id: 2, interestRate: 0.0825, presentValue: 250000 },
      { _id: 3, interestRate: 0.0425, presentValue: 1000 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          effectiveRate: { $subtract: [{ $exp: '$interestRate' }, 1] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, effectiveRate: 0.0832870676749586 },
      { _id: 2, effectiveRate: 0.0859986734390565 },
      { _id: 3, effectiveRate: 0.043416056373678 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/
 */
test('$floor', t => {
  // Behavior
  t.is(evalExpression({ $floor: 1 }), 1)
  t.is(evalExpression({ $floor: 7.8 }), 7)
  t.is(evalExpression({ $floor: -2.8 }), -3)

  // Example
  {
    const docs = [
      { _id: 1, value: 9.25 },
      { _id: 2, value: 8.73 },
      { _id: 3, value: 4.32 },
      { _id: 4, value: -5.34 },
    ]

    const aggregate = compileAggregationPipeline([
      { $project: { value: 1, floorValue: { $floor: '$value' } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, value: 9.25, floorValue: 9 },
      { _id: 2, value: 8.73, floorValue: 8 },
      { _id: 3, value: 4.32, floorValue: 4 },
      { _id: 4, value: -5.34, floorValue: -6 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/ln/
 */
test('$ln', t => {
  // Behavior
  t.is(evalExpression({ $ln: 1 }), 0)
  t.is(evalExpression({ $ln: Math.E }), 1)
  t.is(evalExpression({ $ln: 10 }), 2.302585092994046)

  // Example
  {
    const docs = [
      { _id: 1, year: '2000', sales: 8700000 },
      { _id: 2, year: '2005', sales: 5000000 },
      { _id: 3, year: '2010', sales: 6250000 },
    ]

    const aggregate = compileAggregationPipeline([
      { $project: { x: '$year', y: { $ln: '$sales' } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, x: '2000', y: 15.978833583624812 },
      { _id: 2, x: '2005', y: 15.424948470398375 },
      { _id: 3, x: '2010', y: 15.648092021712584 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/
 */
test('$log', t => {
  // Behavior
  t.is(evalExpression({ $log: [100, 10] }), 2)
  t.is(evalExpression({ $log: [100, Math.E] }), 4.605170185988092)

  // Example
  {
    const docs = [
      { _id: 1, int: 5 },
      { _id: 2, int: 2 },
      { _id: 3, int: 23 },
      { _id: 4, int: 10 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          bitsNeeded: {
            $floor: { $add: [1, { $log: ['$int', 2] }] },
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, bitsNeeded: 3 },
      { _id: 2, bitsNeeded: 2 },
      { _id: 3, bitsNeeded: 5 },
      { _id: 4, bitsNeeded: 4 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/
 */
test('$log10', t => {
  // Behavior
  t.is(evalExpression({ $log10: 1 }), 0)
  t.is(evalExpression({ $log10: 10 }), 1)
  t.is(evalExpression({ $log10: 100 }), 2)
  t.is(evalExpression({ $log10: 1000 }), 3)

  // Example
  {
    const docs = [
      { _id: 1, H3O: 0.0025 },
      { _id: 2, H3O: 0.001 },
      { _id: 3, H3O: 0.02 },
    ]

    const aggregate = compileAggregationPipeline([
      { $project: { pH: { $multiply: [-1, { $log10: '$H3O' }] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, pH: 2.6020599913279625 },
      { _id: 2, pH: 3 },
      { _id: 3, pH: 1.6989700043360187 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/mod/
 */
test('$mod', t => {
  // Example
  {
    const docs = [
      { _id: 1, city: 'New York', hours: 80, tasks: 7 },
      { _id: 2, city: 'Singapore', hours: 40, tasks: 4 },
    ]

    const aggregate = compileAggregationPipeline([
      { $project: { remainder: { $mod: ['$hours', '$tasks'] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, remainder: 3 },
      { _id: 2, remainder: 0 },
    ])
  }

  // Negative Dividend
  {
    const docs = [{ _id: 1, dividend: -13, divisor: 9 }]

    const aggregate = compileAggregationPipeline([
      { $project: { remainder: { $mod: ['$dividend', '$divisor'] } } },
    ])

    t.deepEqual(aggregate(docs), [{ _id: 1, remainder: -4 }])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/
 */
test('$multiply', t => {
  const docs = [
    {
      _id: 1,
      item: 'abc',
      price: 10,
      quantity: 2,
      date: new Date('2014-03-01T08:00:00Z'),
    },
    {
      _id: 2,
      item: 'jkl',
      price: 20,
      quantity: 1,
      date: new Date('2014-03-01T09:00:00Z'),
    },
    {
      _id: 3,
      item: 'xyz',
      price: 5,
      quantity: 10,
      date: new Date('2014-03-15T09:00:00Z'),
    },
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        date: 1,
        item: 1,
        total: { $multiply: ['$price', '$quantity'] },
      },
    },
  ])

  t.deepEqual(aggregate(docs), [
    { _id: 1, item: 'abc', date: new Date('2014-03-01T08:00:00Z'), total: 20 },
    { _id: 2, item: 'jkl', date: new Date('2014-03-01T09:00:00Z'), total: 20 },
    { _id: 3, item: 'xyz', date: new Date('2014-03-15T09:00:00Z'), total: 50 },
  ])
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/pow/
 */
test('$pow', t => {
  t.is(evalExpression({ $pow: [5, 0] }), 1)
  t.is(evalExpression({ $pow: [5, 2] }), 25)
  t.is(evalExpression({ $pow: [5, -2] }), 0.04)
  t.is(evalExpression({ $pow: [-5, 0.5] }), Number.NaN)

  // Example
  {
    const docs = [
      {
        _id: 1,
        scores: [
          { name: 'dave123', score: 85 },
          { name: 'dave2', score: 90 },
          { name: 'ahn', score: 71 },
        ],
      },
      {
        _id: 2,
        scores: [
          { name: 'li', quiz: 2, score: 96 },
          { name: 'annT', score: 77 },
          { name: 'ty', score: 82 },
        ],
      },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: { variance: { $pow: [{ $stdDevPop: '$scores.score' }, 2] } },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, variance: 64.66666666666667 },
      { _id: 2, variance: 64.66666666666667 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/
 */
test('$round', t => {
  t.is(evalExpression({ $round: [1234.5678, 2] }), 1234.57)
  t.is(evalExpression({ $round: [1234.5678, -2] }), 1200)
  t.is(evalExpression({ $round: [1234.5678, -4] }), 0)
  t.is(evalExpression({ $round: [1234.5678, 0] }), 1235)

  // Rounding to Even Values
  {
    const docs = [
      { _id: 1, value: 10.5 },
      { _id: 2, value: 11.5 },
      { _id: 3, value: 12.5 },
      { _id: 4, value: 13.5 },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          value: { $round: ['$value', 0] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, value: 10 },
      { _id: 2, value: 12 },
      { _id: 3, value: 12 },
      { _id: 4, value: 14 },
    ])
  }

  // Returned Data Type
  t.is(evalExpression({ $round: [Number.NaN, 1] }), Number.NaN)
  t.is(evalExpression({ $round: [null, 1] }), null)
  t.is(
    evalExpression({ $round: [Number.POSITIVE_INFINITY, 1] }),
    Number.POSITIVE_INFINITY,
  )
  t.is(
    evalExpression({ $round: [Number.NEGATIVE_INFINITY, 1] }),
    Number.NEGATIVE_INFINITY,
  )

  // Example
  {
    const docs = [
      { _id: 1, value: 19.25 },
      { _id: 2, value: 28.73 },
      { _id: 3, value: 34.32 },
      { _id: 4, value: -45.39 },
    ]

    {
      const aggregate = compileAggregationPipeline([
        { $project: { roundedValue: { $round: ['$value', 1] } } },
      ])

      t.deepEqual(aggregate(docs), [
        { _id: 1, roundedValue: 19.2 },
        { _id: 2, roundedValue: 28.7 },
        { _id: 3, roundedValue: 34.3 },
        { _id: 4, roundedValue: -45.4 },
      ])
    }

    {
      const aggregate = compileAggregationPipeline([
        { $project: { roundedValue: { $round: ['$value', -1] } } },
      ])

      t.deepEqual(aggregate(docs), [
        { _id: 1, roundedValue: 10 },
        { _id: 2, roundedValue: 20 },
        { _id: 3, roundedValue: 30 },
        { _id: 4, roundedValue: -50 },
      ])
    }

    {
      const aggregate = compileAggregationPipeline([
        { $project: { roundedValue: { $round: ['$value', 0] } } },
      ])

      t.deepEqual(aggregate(docs), [
        { _id: 1, roundedValue: 19 },
        { _id: 2, roundedValue: 29 },
        { _id: 3, roundedValue: 34 },
        { _id: 4, roundedValue: -45 },
      ])
    }
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/sigmoid/
 */
test.todo('$sigmoid')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/
 */
test('$sqrt', t => {
  // Behavior
  t.is(evalExpression({ $sqrt: 25 }), 5)
  t.is(evalExpression({ $sqrt: 30 }), 5.477225575051661)
  t.is(evalExpression({ $sqrt: null }), null)

  // Example
  {
    const docs = [
      { _id: 1, p1: { x: 5, y: 8 }, p2: { x: 0, y: 5 } },
      { _id: 2, p1: { x: -2, y: 1 }, p2: { x: 1, y: 5 } },
      { _id: 3, p1: { x: 4, y: 4 }, p2: { x: 4, y: 0 } },
    ]

    const aggregate = compileAggregationPipeline([
      {
        $project: {
          distance: {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: ['$p2.y', '$p1.y'] }, 2] },
                { $pow: [{ $subtract: ['$p2.x', '$p1.x'] }, 2] },
              ],
            },
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, distance: 5.830951894845301 },
      { _id: 2, distance: 5 },
      { _id: 3, distance: 4 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/
 */
test('$subtract', t => {
  const docs = [
    {
      _id: 1,
      item: 'abc',
      price: 10,
      fee: 2,
      discount: 5,
      date: new Date('2014-03-01T08:00:00Z'), // 1393660800000
    },
    {
      _id: 2,
      item: 'jkl',
      price: 20,
      fee: 1,
      discount: 2,
      date: new Date('2014-03-01T09:00:00Z'), // 1393664400000
    },
  ]

  // Subtract Numbers
  {
    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          total: { $subtract: [{ $add: ['$price', '$fee'] }, '$discount'] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc', total: 7 },
      { _id: 2, item: 'jkl', total: 19 },
    ])
  }

  // Subtract Two Dates
  {
    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          dateDifference: {
            $subtract: [new Date('2020-01-23T16:39:06.187Z'), '$date'],
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc', dateDifference: 186136746187 },
      { _id: 2, item: 'jkl', dateDifference: 186133146187 },
    ])
  }

  // Subtract Milliseconds from a Date
  {
    const aggregate = compileAggregationPipeline([
      {
        $project: {
          item: 1,
          dateDifference: { $subtract: ['$date', 5 * 60 * 1000] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'abc', dateDifference: new Date('2014-03-01T07:55:00Z') },
      { _id: 2, item: 'jkl', dateDifference: new Date('2014-03-01T08:55:00Z') },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/trunc/
 */
test('$trunc', t => {
  // Syntax
  t.is(evalExpression({ $trunc: [1234.5678, 2] }), 1234.56)
  t.is(evalExpression({ $trunc: [1234.5678, -2] }), 1200)
  t.is(evalExpression({ $trunc: [1234.5678, -5] }), 0)
  t.is(evalExpression({ $trunc: [1234.5678, 0] }), 1234)

  // Behavior
  t.is(evalExpression({ $trunc: [Number.NaN, 1] }), Number.NaN)
  t.is(evalExpression({ $trunc: [null, 1] }), null)
  t.is(
    evalExpression({ $trunc: [Number.POSITIVE_INFINITY, 1] }),
    Number.POSITIVE_INFINITY,
  )
  t.is(
    evalExpression({ $trunc: [Number.NEGATIVE_INFINITY, 1] }),
    Number.NEGATIVE_INFINITY,
  )

  // Example
  const docs = [
    { _id: 1, value: 19.25 },
    { _id: 2, value: 28.73 },
    { _id: 3, value: 34.32 },
    { _id: 4, value: -45.34 },
  ]

  // The following aggregation returns value truncated to the first decimal place:
  {
    const aggregate = compileAggregationPipeline([
      { $project: { truncatedValue: { $trunc: ['$value', 1] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, truncatedValue: 19.2 },
      { _id: 2, truncatedValue: 28.7 },
      { _id: 3, truncatedValue: 34.3 },
      { _id: 4, truncatedValue: -45.3 },
    ])
  }

  // The following aggregation returns value truncated to the first place:
  {
    const aggregate = compileAggregationPipeline([
      { $project: { truncatedValue: { $trunc: ['$value', -1] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, truncatedValue: 10 },
      { _id: 2, truncatedValue: 20 },
      { _id: 3, truncatedValue: 30 },
      { _id: 4, truncatedValue: -40 },
    ])
  }

  // The following aggregation returns value truncated to the whole integer:
  {
    const aggregate = compileAggregationPipeline([
      { $project: { truncatedValue: { $trunc: ['$value', 0] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, truncatedValue: 19 },
      { _id: 2, truncatedValue: 28 },
      { _id: 3, truncatedValue: 34 },
      { _id: 4, truncatedValue: -45 },
    ])
  }
})
