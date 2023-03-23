import test from 'ava'
import { Long, ObjectId } from 'bson'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

// test('expression:$toDouble', async t => {
//   const documents = [
//     { _id: 1, date: new Date('2018-06-01'), temp: '26.1C' },
//     { _id: 2, date: new Date('2018-06-02'), temp: '25.1C' },
//     { _id: 3, date: new Date('2018-06-03'), temp: '25.4C' }
//   ]

//   const aggregate = compileAggregationPipeline([
//     {
//       $addFields: {
//         degrees: { $toDouble: { $substrBytes: ['$temp', 0, 4] } }
//       }
//     }
//   ])

//   t.deepEqual(
//     await toArray(aggregate(documents)),
//     [
//       { _id: 1, date: new Date('2018-06-01T00:00:00Z'), temp: '26.1C', degrees: 26.1 },
//       { _id: 2, date: new Date('2018-06-02T00:00:00Z'), temp: '25.1C', degrees: 25.1 },
//       { _id: 3, date: new Date('2018-06-03T00:00:00Z'), temp: '25.4C', degrees: 25.4 }
//     ]
//   )
// })

test('expression:$toBool', async t => {
  const documents = [
    { _id: 1, item: 'apple', qty: 5, shipped: true },
    { _id: 2, item: 'pie', qty: 10, shipped: 0 },
    { _id: 3, item: 'ice cream', shipped: 1 },
    { _id: 4, item: 'almonds', qty: 2, shipped: 'true' },
    { _id: 5, item: 'pecans', shipped: 'false' },
    { _id: 6, item: 'nougat', shipped: '' }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $addFields: {
        convertedShippedFlag: {
          $switch: {
            branches: [
              { case: { $eq: ['$shipped', 'false'] }, then: false },
              { case: { $eq: ['$shipped', ''] }, then: false }
            ],
            default: { $toBool: '$shipped' }
          }
        }
      }
    },
    {
      $match: { convertedShippedFlag: false }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 2, item: 'pie', qty: 10, shipped: 0, convertedShippedFlag: false },
      { _id: 5, item: 'pecans', shipped: 'false', convertedShippedFlag: false },
      { _id: 6, item: 'nougat', shipped: '', convertedShippedFlag: false }
    ]
  )
})

test('expression:$toObjectId', async t => {
  const documents = [
    { _id: '5ab9cbe531c2ab715d42129a', item: 'apple', qty: 10 },
    { _id: new ObjectId('5ab9d0b831c2ab715d4212a8'), item: 'pie', qty: 5 },
    { _id: new ObjectId('5ab9d2d331c2ab715d4212b3'), item: 'ice cream', qty: 20 },
    { _id: '5ab9e16431c2ab715d4212b4', item: 'almonds', qty: 50 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $addFields: {
        convertedId: { $toObjectId: '$_id' }
      }
    },
    {
      $sort: { convertedId: -1 }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      {
        _id: '5ab9e16431c2ab715d4212b4',
        item: 'almonds',
        qty: 50,
        convertedId: new ObjectId('5ab9e16431c2ab715d4212b4')
      },
      {
        _id: new ObjectId('5ab9d2d331c2ab715d4212b3'),
        item: 'ice cream',
        qty: 20,
        convertedId: new ObjectId('5ab9d2d331c2ab715d4212b3')
      },
      {
        _id: new ObjectId('5ab9d0b831c2ab715d4212a8'),
        item: 'pie',
        qty: 5,
        convertedId: new ObjectId('5ab9d0b831c2ab715d4212a8')
      },
      {
        _id: '5ab9cbe531c2ab715d42129a',
        item: 'apple',
        qty: 10,
        convertedId: new ObjectId('5ab9cbe531c2ab715d42129a')
      }
    ]
  )
})

test('expression:$toString', async t => {
  const documents = [
    { _id: 1, item: 'apple', qty: 5, zipcode: 93445 },
    { _id: 2, item: 'almonds', qty: 2, zipcode: '12345-0030' },
    { _id: 3, item: 'peaches', qty: 5, zipcode: 12345 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $addFields: {
        convertedZipCode: { $toString: '$zipcode' }
      }
    },
    {
      $sort: { convertedZipCode: 1 }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      {
        _id: 3,
        item: 'peaches',
        qty: 5,
        zipcode: 12345,
        convertedZipCode: '12345'
      },
      {
        _id: 2,
        item: 'almonds',
        qty: 2,
        zipcode: '12345-0030',
        convertedZipCode: '12345-0030'
      },
      {
        _id: 1,
        item: 'apple',
        qty: 5,
        zipcode: 93445,
        convertedZipCode: '93445'
      }
    ]
  )
})

test('expression:$type', async t => {
  const documents = [
    { _id: 0, a: 8 },
    { _id: 1, a: [41.63, 88.19] },
    { _id: 2, a: { a: 'apple', b: 'banana', c: 'carrot' } },
    { _id: 3, a: 'caribou' },
    { _id: 4, a: new Long(71) },
    { _id: 5 }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        a: { $type: '$a' }
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 0, a: 'double' },
      { _id: 1, a: 'array' },
      { _id: 2, a: 'object' },
      { _id: 3, a: 'string' },
      { _id: 4, a: 'long' },
      { _id: 5, a: 'missing' }
    ]
  )
})
