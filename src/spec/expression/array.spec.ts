import test from 'ava'

import { compileExpression, compilePipeline } from '../../exports.js'

function evalExpression(expr: unknown, doc?: unknown): unknown {
  return compileExpression(expr)(doc)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/concatArrays/
 */
test('$concatArrays', t => {
  // Behavior section
  t.deepEqual(evalExpression({ $concatArrays: [['hello', ' '], ['world']] }), [
    'hello',
    ' ',
    'world',
  ])
  t.deepEqual(
    evalExpression({
      $concatArrays: [
        ['hello', ' '],
        [['world'], 'again'],
      ],
    }),
    ['hello', ' ', ['world'], 'again'],
  )

  // Example section
  {
    const docs = [
      { _id: 1, instock: ['chocolate'], ordered: ['butter', 'apples'] },
      { _id: 2, instock: ['apples', 'pudding', 'pie'] },
      { _id: 3, instock: ['pears', 'pecans'], ordered: ['cherries'] },
      { _id: 4, instock: ['ice cream'], ordered: [] },
    ]

    const aggregate = compilePipeline([
      { $project: { items: { $concatArrays: ['$instock', '$ordered'] } } },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, items: ['chocolate', 'butter', 'apples'] },
      { _id: 2, items: null },
      { _id: 3, items: ['pears', 'pecans', 'cherries'] },
      { _id: 4, items: ['ice cream'] },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/in/
 */
test('$in', t => {
  // Definition section
  t.is(evalExpression({ $in: [2, [1, 2, 3]] }), true)
  t.is(evalExpression({ $in: ['abc', ['xyz', 'abc']] }), true)
  t.is(evalExpression({ $in: ['xy', ['xyz', 'abc']] }), false)
  t.is(evalExpression({ $in: [['a'], ['a']] }), false)
  t.is(evalExpression({ $in: [['a'], [['a']]] }), true)
  t.is(evalExpression({ $in: [/^a/, ['a']] }), false)
  t.is(evalExpression({ $in: [/^a/, [/^a/]] }), true)

  // Example section
  {
    const docs = [
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

    const aggregate = compilePipeline([
      {
        $project: {
          'store location': '$location',
          'has bananas': {
            $in: ['bananas', '$in_stock'],
          },
        },
      },
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, 'store location': '24th Street', 'has bananas': true },
      { _id: 2, 'store location': '36th Street', 'has bananas': true },
      { _id: 3, 'store location': '82nd Street', 'has bananas': false },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/isArray/
 */
test('$isArray', t => {
  // Behavior section
  t.is(evalExpression({ $isArray: 'hello' }), false)
  t.is(evalExpression({ $isArray: ['hello'] }), false)
  t.is(evalExpression({ $isArray: [['hello']] }), true)

  // Example section
  {
    const docs = [
      { _id: 1, instock: ['chocolate'], ordered: ['butter', 'apples'] },
      { _id: 2, instock: ['apples', 'pudding', 'pie'] },
      { _id: 3, instock: ['pears', 'pecans'], ordered: ['cherries'] },
      { _id: 4, instock: ['ice cream'], ordered: [] },
    ]

    const aggregate = compilePipeline([
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

    t.deepEqual(aggregate(docs), [
      { _id: 1, items: ['chocolate', 'butter', 'apples'] },
      { _id: 2, items: 'One or more fields is not an array.' },
      { _id: 3, items: ['pears', 'pecans', 'cherries'] },
      { _id: 4, items: ['ice cream'] },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/
 */
test('$size', t => {
  // Example section
  {
    const docs = [
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
    ]

    const aggregate = compilePipeline([
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
    ])

    t.deepEqual(aggregate(docs), [
      { _id: 1, item: 'ABC1', numberOfColors: 3 },
      { _id: 2, item: 'ABC2', numberOfColors: 1 },
      { _id: 3, item: 'XYZ1', numberOfColors: 0 },
      { _id: 4, item: 'ZZZ1', numberOfColors: 'NA' },
      { _id: 5, item: 'ZZZ2', numberOfColors: 'NA' },
    ])
  }
})
