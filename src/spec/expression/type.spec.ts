import test from 'ava'
import { Binary, Decimal128, Int32, Long, ObjectId } from 'bson'

import { compileExpression, compilePipeline } from '../../exports.js'

function evalExpression(expr: unknown, doc?: unknown): unknown {
  return compileExpression(expr)(doc)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/convert/
 */
test.todo('$convert')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/isNumber/
 */
test('$isNumber', t => {
  // Use $isNumber to Check if a Field is Numeric
  {
    const docs = [
      { _id: 1, reading: Decimal128.fromString('26.0') },
      { _id: 2, reading: Long.fromNumber(25) },
      { _id: 3, reading: new Int32(24) },
      { _id: 4, reading: 24.0 },
      { _id: 5, reading: '24' },
      { _id: 6, reading: [26] },
    ]

    const aggregate = compilePipeline([
      {
        $addFields: {
          isNumber: { $isNumber: '$reading' },
          hasType: { $type: '$reading' },
        },
      },
    ])

    t.like(aggregate(docs), [
      {
        _id: 1,
        isNumber: true,
        hasType: 'decimal',
      },
      { _id: 2, reading: Long.fromNumber(25), isNumber: true, hasType: 'long' },
      { _id: 3, reading: new Int32(24), isNumber: true, hasType: 'int' },
      { _id: 4, reading: 24, isNumber: true, hasType: 'double' },
      { _id: 5, reading: '24', isNumber: false, hasType: 'string' },
      {
        _id: 6,
        reading: [26],
        isNumber: false,
        hasType: 'array',
      },
    ])
  }

  // Conditionally Modify Fields using $isNumber
  {
    const docs = [
      {
        student_id: 457864153,
        class_id: '01',
        class_desc: 'Algebra',
        grade: 'A',
      },
      {
        student_id: 457864153,
        class_id: '02',
        class_desc: 'Chemistry',
        grade: 3.0,
      },
      {
        student_id: 978451637,
        class_id: '03',
        class_desc: 'Physics',
        grade: 'C',
      },
      {
        student_id: 978451637,
        class_id: '04',
        class_desc: 'English',
        grade: 4.0,
      },
    ]

    const aggregate = compilePipeline([
      {
        $addFields: {
          points: {
            $cond: {
              if: { $isNumber: '$grade' },
              then: '$grade',
              else: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$grade', 'A'] }, then: 4.0 },
                    { case: { $eq: ['$grade', 'B'] }, then: 3.0 },
                    { case: { $eq: ['$grade', 'C'] }, then: 2.0 },
                    { case: { $eq: ['$grade', 'D'] }, then: 1.0 },
                    { case: { $eq: ['$grade', 'F'] }, then: 0.0 },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$student_id',
          GPA: {
            $avg: '$points',
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 457864153, GPA: 3.5 },
      { _id: 978451637, GPA: 3 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/
 */
test('$toBool', t => {
  // Behavior
  t.is(evalExpression({ $toBool: false }), false)
  t.is(evalExpression({ $toBool: 1.99999 }), true)
  t.is(evalExpression({ $toBool: Decimal128.fromString('5') }), true)
  t.is(evalExpression({ $toBool: Decimal128.fromString('0') }), false)
  t.is(evalExpression({ $toBool: 100 }), true)
  t.is(evalExpression({ $toBool: new Date('2018-03-26T04:38:28.044Z') }), true)
  t.is(evalExpression({ $toBool: 'false' }), true)
  t.is(evalExpression({ $toBool: '' }), true)
  t.is(evalExpression({ $toBool: null }), false)

  // Example
  {
    const docs = [
      { _id: 1, item: 'apple', qty: 5, shipped: true },
      { _id: 2, item: 'pie', qty: 10, shipped: 0 },
      { _id: 3, item: 'ice cream', shipped: 1 },
      { _id: 4, item: 'almonds', qty: 2, shipped: 'true' },
      { _id: 5, item: 'pecans', shipped: 'false' }, // Note: All strings convert to true
      { _id: 6, item: 'nougat', shipped: '' }, // Note: All strings convert to true
    ]

    const aggregate = compilePipeline([
      {
        $addFields: {
          convertedShippedFlag: {
            $switch: {
              branches: [
                { case: { $eq: ['$shipped', 'false'] }, then: false },
                { case: { $eq: ['$shipped', ''] }, then: false },
              ],
              default: { $toBool: '$shipped' },
            },
          },
        },
      },
      {
        $match: { convertedShippedFlag: false },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 2, item: 'pie', qty: 10, shipped: 0, convertedShippedFlag: false },
      { _id: 5, item: 'pecans', shipped: 'false', convertedShippedFlag: false },
      { _id: 6, item: 'nougat', shipped: '', convertedShippedFlag: false },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDate/
 */
test.todo('$toDate')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/
 */
test('$toDouble', t => {
  // Behavior
  t.is(evalExpression({ $toDouble: true }), 1)
  t.is(evalExpression({ $toDouble: false }), 0)
  t.is(evalExpression({ $toDouble: 2.5 }), 2.5)
  t.is(evalExpression({ $toDouble: new Int32(5) }), 5)
  t.is(evalExpression({ $toDouble: Long.fromNumber(10000) }), 10000)
  t.is(evalExpression({ $toDouble: '-5.5' }), -5.5)
  t.is(
    evalExpression({ $toDouble: new Date('2018-03-27T05:04:47.890Z') }),
    1522127087890,
  )

  // Example
  {
    const docs = [
      { _id: 1, date: new Date('2018-06-01'), temp: '26.1C' },
      { _id: 2, date: new Date('2018-06-02'), temp: '25.1C' },
      { _id: 3, date: new Date('2018-06-03'), temp: '25.4C' },
    ]

    const aggregate = compilePipeline([
      {
        $addFields: {
          degrees: { $toDouble: { $substrBytes: ['$temp', 0, 4] } },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      {
        _id: 1,
        date: new Date('2018-06-01T00:00:00Z'),
        temp: '26.1C',
        degrees: 26.1,
      },
      {
        _id: 2,
        date: new Date('2018-06-02T00:00:00Z'),
        temp: '25.1C',
        degrees: 25.1,
      },
      {
        _id: 3,
        date: new Date('2018-06-03T00:00:00Z'),
        temp: '25.4C',
        degrees: 25.4,
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/
 */
test('$toInt', t => {
  // Behavior
  t.like(evalExpression({ $toInt: true }), { constructor: Int32, value: 1 })
  t.like(evalExpression({ $toInt: false }), { constructor: Int32, value: 0 })
  t.like(evalExpression({ $toInt: 1.99999 }), { constructor: Int32, value: 1 })
  t.like(evalExpression({ $toInt: Long.fromString('5000') }), {
    constructor: Int32,
    value: 5000,
  })
  t.throws(() => evalExpression({ $toInt: Long.fromString('922337203600') }), {
    instanceOf: TypeError,
    message: 'Cannot accept 922337203600 as INT',
  })
  t.like(evalExpression({ $toInt: '-2' }), { constructor: Int32, value: -2 })
  t.throws(() => evalExpression({ $toInt: '2.5' }), {
    instanceOf: TypeError,
    message: 'Cannot convert 2.5 to INT',
  })
  t.is(evalExpression({ $toInt: null }), null)

  // Example
  {
    const docs = [
      { _id: 1, item: 'apple', qty: '5', price: 10 },
      { _id: 2, item: 'pie', qty: '10', price: new Int32(20) },
      { _id: 3, item: 'ice cream', qty: '2', price: '4.99' },
      { _id: 4, item: 'almonds', qty: '5', price: 5 },
    ]

    const aggregate = compilePipeline([
      {
        $addFields: {
          convertedPrice: { $toDouble: '$price' },
          convertedQty: { $toInt: '$qty' },
        },
      },
      {
        $project: {
          item: 1,
          totalPrice: { $multiply: ['$convertedPrice', '$convertedQty'] },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'apple', totalPrice: 50 },
      { _id: 2, item: 'pie', totalPrice: 200 },
      { _id: 3, item: 'ice cream', totalPrice: 9.98 },
      { _id: 4, item: 'almonds', totalPrice: 25 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLong/
 */
test.todo('$toLong')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/
 */
test.todo('$toObjectId')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/
 */
test('$toString', t => {
  // Behavior
  t.is(evalExpression({ $toString: true }), 'true')
  t.is(evalExpression({ $toString: false }), 'false')
  t.is(evalExpression({ $toString: 2.5 }), '2.5')
  t.is(evalExpression({ $toString: new Int32(2) }), '2')
  t.is(evalExpression({ $toString: Long.fromNumber(1000) }), '1000')
  t.is(
    evalExpression({ $toString: new ObjectId('5ab9c3da31c2ab715d421285') }),
    '5ab9c3da31c2ab715d421285',
  )
  t.is(
    evalExpression({ $toString: new Date('2018-03-27T16:58:51.538Z') }),
    '2018-03-27T16:58:51.538Z',
  )
  t.is(
    evalExpression({ $toString: new Binary([0x68, 0x6e, 0x33, 0x66]) }),
    'hn3f',
  )

  // Example
  {
    const docs = [
      { _id: 1, item: 'apple', qty: 5, zipcode: 93445 },
      { _id: 2, item: 'almonds', qty: 2, zipcode: '12345-0030' },
      { _id: 3, item: 'peaches', qty: 5, zipcode: 12345 },
    ]

    const aggregate = compilePipeline([
      {
        $addFields: {
          convertedZipCode: { $toString: '$zipcode' },
        },
      },
      {
        $sort: { convertedZipCode: 1 },
      },
    ])

    t.deepEqual(aggregate(docs), [
      {
        _id: 3,
        item: 'peaches',
        qty: 5,
        zipcode: 12345,
        convertedZipCode: '12345',
      },
      {
        _id: 2,
        item: 'almonds',
        qty: 2,
        zipcode: '12345-0030',
        convertedZipCode: '12345-0030',
      },
      {
        _id: 1,
        item: 'apple',
        qty: 5,
        zipcode: 93445,
        convertedZipCode: '93445',
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/
 */
test('$type', t => {
  // Behavior
  t.is(evalExpression({ $type: 'a' }), 'string')
  t.is(evalExpression({ $type: /a/ }), 'regex')
  t.is(evalExpression({ $type: 1 }), 'double')
  t.is(evalExpression({ $type: Long.fromNumber(627) }), 'long')
  t.is(evalExpression({ $type: { x: 1 } }), 'object')
  t.is(evalExpression({ $type: [[1, 2, 3]] }), 'array')

  // Example
  {
    const docs = [
      { _id: 0, a: 8 },
      { _id: 1, a: [41.63, 88.19] },
      { _id: 2, a: { a: 'apple', b: 'banana', c: 'carrot' } },
      { _id: 3, a: 'caribou' },
      { _id: 4, a: Long.fromNumber(71) },
      { _id: 5 },
    ]

    const aggregate = compilePipeline([
      {
        $project: {
          a: { $type: '$a' },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 0, a: 'double' },
      { _id: 1, a: 'array' },
      { _id: 2, a: 'object' },
      { _id: 3, a: 'string' },
      { _id: 4, a: 'long' },
      { _id: 5, a: 'missing' },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toUUID/
 */
test.todo('$toUUID')
