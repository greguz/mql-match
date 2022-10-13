import test from 'ava'

import { compileFilterQuery } from './filterQuery.mjs'

function filter (data, query) {
  return data.filter(compileFilterQuery(query))
}

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
