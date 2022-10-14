import test from 'ava'

import { compileFilterQuery } from './filterQuery.mjs'

function filter (data, query) {
  return data.filter(compileFilterQuery(query))
}

test('filter:$elemMatch', t => {
  t.deepEqual(
    filter(
      [
        { _id: 1, results: [82, 85, 88] },
        { _id: 2, results: [75, 88, 89] }
      ],
      {
        results: {
          $elemMatch: {
            $gte: 80,
            $lt: 85
          }
        }
      }
    ),
    [{ _id: 1, results: [82, 85, 88] }]
  )
  const items = [
    {
      _id: 1,
      results: [
        { product: 'abc', score: 10 },
        { product: 'xyz', score: 5 }
      ]
    },
    {
      _id: 2,
      results: [
        { product: 'abc', score: 8 },
        { product: 'xyz', score: 7 }
      ]
    },
    {
      _id: 3,
      results: [
        { product: 'abc', score: 7 },
        { product: 'xyz', score: 8 }
      ]
    },
    {
      _id: 4,
      results: [
        { product: 'abc', score: 7 },
        { product: 'def', score: 8 }
      ]
    }
  ]
  t.deepEqual(
    filter(
      items,
      {
        results: {
          $elemMatch: {
            product: 'xyz',
            score: {
              $gte: 8
            }
          }
        }
      }
    ),
    [
      {
        _id: 3,
        results: [
          { product: 'abc', score: 7 },
          { product: 'xyz', score: 8 }
        ]
      }
    ]
  )
  t.deepEqual(
    filter(
      items,
      {
        results: {
          $elemMatch: {
            product: {
              $ne: 'xyz'
            }
          }
        }
      }
    ),
    [
      {
        _id: 1,
        results: [
          { product: 'abc', score: 10 },
          { product: 'xyz', score: 5 }
        ]
      },
      {
        _id: 2,
        results: [
          { product: 'abc', score: 8 },
          { product: 'xyz', score: 7 }
        ]
      },
      {
        _id: 3,
        results: [
          { product: 'abc', score: 7 },
          { product: 'xyz', score: 8 }
        ]
      },
      {
        _id: 4,
        results: [
          { product: 'abc', score: 7 },
          { product: 'def', score: 8 }
        ]
      }
    ]
  )
  t.deepEqual(
    filter(
      items,
      {
        'results.product': {
          $ne: 'xyz'
        }
      }
    ),
    [
      {
        _id: 4,
        results: [
          { product: 'abc', score: 7 },
          { product: 'def', score: 8 }
        ]
      }
    ]
  )
})

test('filter:$eq', t => {
  const items = [
    { _id: 1, item: { name: 'ab', code: '123' }, qty: 15, tags: ['A', 'B', 'C'] },
    { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
    { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
    { _id: 4, item: { name: 'xy', code: '456' }, qty: 30, tags: ['B', 'A'] },
    { _id: 5, item: { name: 'mn', code: '000' }, qty: 20, tags: [['A', 'B'], 'C'] }
  ]
  t.deepEqual(
    filter(items, { 'item.name': { $eq: 'ab' } }),
    [
      { _id: 1, item: { name: 'ab', code: '123' }, qty: 15, tags: ['A', 'B', 'C'] }
    ]
  )
  t.deepEqual(
    filter(items, { qty: { $eq: 20 } }),
    [
      { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
      { _id: 5, item: { name: 'mn', code: '000' }, qty: 20, tags: [['A', 'B'], 'C'] }
    ]
  )
  t.deepEqual(
    filter(items, {
      tags: {
        $eq: ['A', 'B']
      }
    }),
    [
      { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
      { _id: 5, item: { name: 'mn', code: '000' }, qty: 20, tags: [['A', 'B'], 'C'] }
    ]
  )
})

test('filter:$size', t => {
  t.throws(() => filter([], { field: { $size: -1 } }))
  const items = [
    { field: ['red', 'green'] },
    { field: ['apple', 'lime'] },
    { field: ['fruit'] },
    { field: ['orange', 'lemon', 'grapefruit'] }
  ]
  t.deepEqual(
    filter(items, { field: { $size: 2 } }),
    [
      { field: ['red', 'green'] },
      { field: ['apple', 'lime'] }
    ]
  )
  t.deepEqual(
    filter(items, { field: { $size: 1 } }),
    [
      { field: ['fruit'] }
    ]
  )
})
