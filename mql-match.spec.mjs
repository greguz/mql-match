import test from 'ava'

import { compileFilterQuery, compileUpdateQuery } from './mql-match.mjs'

function filter (data, query) {
  return data.filter(compileFilterQuery(query))
}

function update (data, query) {
  const fn = compileUpdateQuery(query)
  if (Array.isArray(data)) {
    return data.map(fn)
  } else {
    return fn(data)
  }
}

test('$delete', t => {
  t.deepEqual(
    update(
      { item: 'hammer', sku: 'unknown', quantity: 3, instock: true },
      { $unset: { quantity: '', instock: '' } }
    ),
    { item: 'hammer', sku: 'unknown' }
  )
})

test('$eq', t => {
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

test('$mul', t => {
  t.deepEqual(
    update(
      { _id: 1, item: 'Hats', price: 10.99, quantity: 25 },
      {
        $mul: {
          price: 1.25,
          quantity: 2
        }
      }
    ),
    { _id: 1, item: 'Hats', price: 13.7375, quantity: 50 }
  )
  t.deepEqual(
    update(
      { _id: 2, item: 'Unknown' },
      { $mul: { price: 100 } }
    ),
    { _id: 2, item: 'Unknown', price: 0 }
  )
})

test('$pop', t => {
  t.deepEqual(
    update(
      { _id: 1, scores: [8, 9, 10] },
      { $pop: { scores: -1 } }
    ),
    { _id: 1, scores: [9, 10] }
  )
  t.deepEqual(
    update(
      { _id: 10, scores: [9, 10] },
      { $pop: { scores: 1 } }
    ),
    { _id: 10, scores: [9] }
  )
})

test('$pull', t => {
  t.deepEqual(
    update(
      [
        {
          _id: 1,
          fruits: ['apples', 'pears', 'oranges', 'grapes', 'bananas'],
          vegetables: ['carrots', 'celery', 'squash', 'carrots']
        },
        {
          _id: 2,
          fruits: ['plums', 'kiwis', 'oranges', 'bananas', 'apples'],
          vegetables: ['broccoli', 'zucchini', 'carrots', 'onions']
        }
      ],
      {
        $pull: {
          fruits: {
            $in: ['apples', 'oranges']
          },
          vegetables: 'carrots'
        }
      }
    ),
    [
      {
        _id: 1,
        fruits: ['pears', 'grapes', 'bananas'],
        vegetables: ['celery', 'squash']
      },
      {
        _id: 2,
        fruits: ['plums', 'kiwis', 'bananas'],
        vegetables: ['broccoli', 'zucchini', 'onions']
      }
    ]
  )
})

test('$rename', t => {
  t.deepEqual(
    update(
      {
        _id: 1,
        alias: ['The American Cincinnatus', 'The American Fabius'],
        mobile: '555-555-5555',
        nmae: { first: 'george', last: 'washington' }
      },
      {
        $rename: {
          nmae: 'name'
        }
      }
    ),
    {
      _id: 1,
      alias: ['The American Cincinnatus', 'The American Fabius'],
      mobile: '555-555-5555',
      name: { first: 'george', last: 'washington' }
    }
  )
})
