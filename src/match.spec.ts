import test from 'ava'

import { compileMatch } from './match.js'

function matchOne(query: unknown, value?: unknown): boolean {
  return compileMatch(query)(value)
}

function matchMany<T>(data: T[], query: unknown) {
  return data.filter(compileMatch(query))
}

test('$elemMatch', t => {
  t.deepEqual(
    matchMany(
      [
        { _id: 1, results: [82, 85, 88] },
        { _id: 2, results: [75, 88, 89] },
      ],
      {
        results: {
          $elemMatch: {
            $gte: 80,
            $lt: 85,
          },
        },
      },
    ),
    [{ _id: 1, results: [82, 85, 88] }],
  )

  const items = [
    {
      _id: 1,
      results: [
        { product: 'abc', score: 10 },
        { product: 'xyz', score: 5 },
      ],
    },
    {
      _id: 2,
      results: [
        { product: 'abc', score: 8 },
        { product: 'xyz', score: 7 },
      ],
    },
    {
      _id: 3,
      results: [
        { product: 'abc', score: 7 },
        { product: 'xyz', score: 8 },
      ],
    },
    {
      _id: 4,
      results: [
        { product: 'abc', score: 7 },
        { product: 'def', score: 8 },
      ],
    },
  ]
  t.deepEqual(
    matchMany(items, {
      results: {
        $elemMatch: {
          product: 'xyz',
          score: {
            $gte: 8,
          },
        },
      },
    }),
    [
      {
        _id: 3,
        results: [
          { product: 'abc', score: 7 },
          { product: 'xyz', score: 8 },
        ],
      },
    ],
  )
  t.deepEqual(
    matchMany(items, {
      results: {
        $elemMatch: {
          product: {
            $ne: 'xyz',
          },
        },
      },
    }),
    [
      {
        _id: 1,
        results: [
          { product: 'abc', score: 10 },
          { product: 'xyz', score: 5 },
        ],
      },
      {
        _id: 2,
        results: [
          { product: 'abc', score: 8 },
          { product: 'xyz', score: 7 },
        ],
      },
      {
        _id: 3,
        results: [
          { product: 'abc', score: 7 },
          { product: 'xyz', score: 8 },
        ],
      },
      {
        _id: 4,
        results: [
          { product: 'abc', score: 7 },
          { product: 'def', score: 8 },
        ],
      },
    ],
  )
  t.deepEqual(
    matchMany(items, {
      'results.product': {
        $ne: 'xyz',
      },
    }),
    [
      {
        _id: 4,
        results: [
          { product: 'abc', score: 7 },
          { product: 'def', score: 8 },
        ],
      },
    ],
  )
})

test('$size', t => {
  t.throws(() => matchMany([], { field: { $size: -1 } }))
  const items = [
    { field: ['red', 'green'] },
    { field: ['apple', 'lime'] },
    { field: ['fruit'] },
    { field: ['orange', 'lemon', 'grapefruit'] },
  ]
  t.deepEqual(matchMany(items, { field: { $size: 2 } }), [
    { field: ['red', 'green'] },
    { field: ['apple', 'lime'] },
  ])
  t.deepEqual(matchMany(items, { field: { $size: 1 } }), [{ field: ['fruit'] }])
})

test('$eq', t => {
  t.true(matchOne({ value: 42 }, { value: 42 }))
  t.true(matchOne({ value: { $eq: 42 } }, { value: 42 }))

  t.true(matchOne({ 'a.b': 42 }, { a: { b: 42 } }))
  t.true(matchOne({ 'a.b': { $eq: 42 } }, { a: { b: 42 } }))

  t.true(
    matchOne(
      { 'items.message': 'hello world' },
      { items: [{ message: 'hello world' }] },
    ),
  )
  t.true(
    matchOne(
      { 'items.message': { $eq: 'hello world' } },
      { items: [{ message: 'hello world' }] },
    ),
  )

  t.true(
    matchOne(
      { obj: { hello: 'world' } },
      {
        obj: {
          hello: 'world',
        },
      },
    ),
  )
  t.true(
    matchOne(
      { obj: { $eq: { hello: 'world' } } },
      {
        obj: {
          hello: 'world',
        },
      },
    ),
  )
  t.false(
    matchOne(
      { obj: { hello: 'world' } },
      {
        obj: {
          hello: 'world',
          oh: 'no',
        },
      },
    ),
  )

  const items = [
    {
      _id: 1,
      item: { name: 'ab', code: '123' },
      qty: 15,
      tags: ['A', 'B', 'C'],
    },
    { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
    { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
    { _id: 4, item: { name: 'xy', code: '456' }, qty: 30, tags: ['B', 'A'] },
    {
      _id: 5,
      item: { name: 'mn', code: '000' },
      qty: 20,
      tags: [['A', 'B'], 'C'],
    },
  ]
  t.deepEqual(matchMany(items, { 'item.name': { $eq: 'ab' } }), [
    {
      _id: 1,
      item: { name: 'ab', code: '123' },
      qty: 15,
      tags: ['A', 'B', 'C'],
    },
  ])
  t.deepEqual(matchMany(items, { qty: { $eq: 20 } }), [
    { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
    {
      _id: 5,
      item: { name: 'mn', code: '000' },
      qty: 20,
      tags: [['A', 'B'], 'C'],
    },
  ])
  t.deepEqual(
    matchMany(items, {
      tags: {
        $eq: ['A', 'B'],
      },
    }),
    [
      { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
      {
        _id: 5,
        item: { name: 'mn', code: '000' },
        qty: 20,
        tags: [['A', 'B'], 'C'],
      },
    ],
  )

  t.true(matchOne({ tags: { $eq: /w/ } }, { tags: ['hello', 'world'] }))
})

test('$expr', t => {
  t.true(
    matchOne(
      {
        $expr: true,
        hello: 'world', // manually tested
      },
      {
        hello: 'world',
        pdor: 'kmer',
      },
    ),
  )
  t.false(
    matchOne(
      {
        $expr: false,
        hello: 'world',
      },
      {
        hello: 'world',
        pdor: 'kmer',
      },
    ),
  )

  const documents = [
    { _id: 1, category: 'food', budget: 400, spent: 450 },
    { _id: 2, category: 'drinks', budget: 100, spent: 150 },
    { _id: 3, category: 'clothes', budget: 100, spent: 50 },
    { _id: 4, category: 'misc', budget: 500, spent: 300 },
    { _id: 5, category: 'travel', budget: 200, spent: 650 },
  ]

  const predicate = compileMatch({ $expr: { $gt: ['$spent', '$budget'] } })

  t.deepEqual(documents.filter(predicate), [
    { _id: 1, category: 'food', budget: 400, spent: 450 },
    { _id: 2, category: 'drinks', budget: 100, spent: 150 },
    { _id: 5, category: 'travel', budget: 200, spent: 650 },
  ])
})

test('$regex', t => {
  t.true(matchOne({ label: { $regex: /world/ } }, { label: 'hello world' }))
  t.false(matchOne({ label: { $regex: /world/ } }, { label: 'za warudo' }))
  t.true(
    matchOne({ label: { $regex: /dio/, $options: 'i' } }, { label: 'DIO' }),
  )
  t.false(matchOne({ label: { $regex: /dio/ } }, { label: 'DIO' }))
  t.throws(() => matchOne({ label: { $options: 'i' } }))
})

test('$type', t => {
  t.true(matchOne({ value: { $type: 'string' } }, { value: 'hello world' }))
  t.true(matchOne({ value: { $type: ['string', 'bool'] } }, { value: false }))
})

test('$exists', t => {
  t.true(matchOne({ value: { $exists: true } }, { value: 'hello world' }))
  t.true(matchOne({ value: { $exists: false } }, { hello: 'world' }))
})

test('$mod', t => {
  t.true(matchOne({ value: { $mod: [2, 0] } }, { value: 42 }))
  t.false(matchOne({ value: { $mod: [2, 0] } }, {}))
})

test('$all', t => {
  const simple = { _id: 1, tags: ['ssl', 'pdor', 'security'] }
  t.true(matchOne({ tags: { $all: ['ssl', 'security'] } }, simple))
  t.true(matchOne({ $and: [{ tags: 'ssl' }, { tags: 'security' }] }, simple))

  const nested = { tags: [['ssl', 'security'], 'pdor'] }
  t.true(matchOne({ tags: { $all: [['ssl', 'security']] } }, nested))
  t.true(matchOne({ $and: [{ tags: ['ssl', 'security'] }] }, nested))
  t.true(matchOne({ tags: ['ssl', 'security'] }, nested))

  const literal = { tags: ['ssl', 'security'] }
  t.true(matchOne({ tags: { $all: [['ssl', 'security']] } }, literal))
  t.true(matchOne({ $and: [{ tags: ['ssl', 'security'] }] }, literal))
  t.true(matchOne({ tags: ['ssl', 'security'] }, literal))
})

test('$comment', t => {
  t.true(matchOne({ $comment: 'oh no' }, { hello: 'world' }))
})
