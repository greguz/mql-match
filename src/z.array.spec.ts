import test from 'ava'

import { compileAggregationPipeline } from './exports.js'

function aggregateArray(
  documents: unknown[],
  stages: Array<Record<string, unknown>>,
) {
  const fn = compileAggregationPipeline(stages)
  return fn(documents)
}

test('$size', t => {
  t.deepEqual(
    aggregateArray(
      [
        { _id: 1, items: ['a', 'b'] },
        { _id: 2, items: [] },
        { _id: 3, items: ['c'] },
      ],
      [{ $project: { size: { $size: '$items' } } }],
    ),
    [
      { _id: 1, size: 2 },
      { _id: 2, size: 0 },
      { _id: 3, size: 1 },
    ],
  )
  t.deepEqual(
    aggregateArray(
      [
        {
          _id: 1,
          item: 'ABC1',
          description: 'product 1',
          colors: ['blue', 'black', 'red'],
        },
        { _id: 2, item: 'ABC2', description: 'product 2', colors: ['purple'] },
        { _id: 3, item: 'XYZ1', description: 'product 3', colors: [] },
        { _id: 4, item: 'ZZZ1', description: 'product 4 - missing colors' },
        {
          _id: 5,
          item: 'ZZZ2',
          description: 'product 5 - colors is string',
          colors: 'blue,red',
        },
      ],
      [
        {
          $project: {
            item: 1,
            numberOfColors: {
              $cond: {
                if: { $isArray: '$colors' },
                then: { $size: '$colors' },
                else: 'NA',
              },
            },
          },
        },
      ],
    ),
    [
      { _id: 1, item: 'ABC1', numberOfColors: 3 },
      { _id: 2, item: 'ABC2', numberOfColors: 1 },
      { _id: 3, item: 'XYZ1', numberOfColors: 0 },
      { _id: 4, item: 'ZZZ1', numberOfColors: 'NA' },
      { _id: 5, item: 'ZZZ2', numberOfColors: 'NA' },
    ],
  )
})

test('$concatArrays', t => {
  const documents = [
    { _id: 1, instock: ['chocolate'], ordered: ['butter', 'apples'] },
    { _id: 2, instock: ['apples', 'pudding', 'pie'] },
    { _id: 3, instock: ['pears', 'pecans'], ordered: ['cherries'] },
    { _id: 4, instock: ['ice cream'], ordered: [] },
  ]

  const aggregate = compileAggregationPipeline([
    { $project: { items: { $concatArrays: ['$instock', '$ordered'] } } },
  ])

  t.deepEqual(aggregate(documents), [
    { _id: 1, items: ['chocolate', 'butter', 'apples'] },
    { _id: 2, items: null },
    { _id: 3, items: ['pears', 'pecans', 'cherries'] },
    { _id: 4, items: ['ice cream'] },
  ])
})

test('$in', t => {
  const documents = [
    {
      _id: 1,
      location: '24th Street',
      in_stock: ['apples', 'oranges', 'bananas'],
    },
    {
      _id: 2,
      location: '36th Street',
      in_stock: ['bananas', 'pears', 'grapes'],
    },
    {
      _id: 3,
      location: '82nd Street',
      in_stock: ['cantaloupes', 'watermelons', 'apples'],
    },
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        'store location': '$location',
        'has bananas': {
          $in: ['bananas', '$in_stock'],
        },
      },
    },
  ])

  t.deepEqual(aggregate(documents), [
    { _id: 1, 'store location': '24th Street', 'has bananas': true },
    { _id: 2, 'store location': '36th Street', 'has bananas': true },
    { _id: 3, 'store location': '82nd Street', 'has bananas': false },
  ])
})

test('$isArray', t => {
  const documents = [
    { _id: 1, instock: ['chocolate'], ordered: ['butter', 'apples'] },
    { _id: 2, instock: ['apples', 'pudding', 'pie'] },
    { _id: 3, instock: ['pears', 'pecans'], ordered: ['cherries'] },
    { _id: 4, instock: ['ice cream'], ordered: [] },
  ]

  const aggregate = compileAggregationPipeline([
    {
      $project: {
        items: {
          $cond: {
            if: {
              $and: [{ $isArray: '$instock' }, { $isArray: '$ordered' }],
            },
            then: { $concatArrays: ['$instock', '$ordered'] },
            else: 'One or more fields is not an array.',
          },
        },
      },
    },
  ])

  t.deepEqual(aggregate(documents), [
    { _id: 1, items: ['chocolate', 'butter', 'apples'] },
    { _id: 2, items: 'One or more fields is not an array.' },
    { _id: 3, items: ['pears', 'pecans', 'cherries'] },
    { _id: 4, items: ['ice cream'] },
  ])
})
