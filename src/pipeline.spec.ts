import test from 'ava'
import { ObjectId } from 'bson'

import { compilePipeline } from './pipeline.js'

async function aggregate(documents: unknown, stages: unknown) {
  const map = compilePipeline(Array.isArray(stages) ? stages : [stages])
  return map(Array.isArray(documents) ? documents : [documents])
}

test('$count', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, subject: 'History', score: 88 },
        { _id: 2, subject: 'History', score: 92 },
        { _id: 3, subject: 'History', score: 97 },
        { _id: 4, subject: 'History', score: 71 },
        { _id: 5, subject: 'History', score: 79 },
        { _id: 6, subject: 'History', score: 83 },
      ],
      [
        {
          $match: {
            score: {
              $gt: 80,
            },
          },
        },
        {
          $count: 'passing_scores',
        },
      ],
    ),
    [{ passing_scores: 4 }],
  )
})

test('$limit', async t => {
  t.deepEqual(
    await aggregate(
      [
        {
          _id: new ObjectId('512bc95fe835e68f199c8686'),
          author: 'dave',
          score: 80,
          views: 100,
        },
        {
          _id: new ObjectId('512bc962e835e68f199c8687'),
          author: 'dave',
          score: 85,
          views: 521,
        },
        {
          _id: new ObjectId('55f5a192d4bede9ac365b257'),
          author: 'ahn',
          score: 60,
          views: 1000,
        },
        {
          _id: new ObjectId('55f5a192d4bede9ac365b258'),
          author: 'li',
          score: 55,
          views: 5000,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b259'),
          author: 'annT',
          score: 60,
          views: 50,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b25a'),
          author: 'li',
          score: 94,
          views: 999,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b25b'),
          author: 'ty',
          score: 95,
          views: 1000,
        },
      ],
      { $limit: 2 },
    ),
    [
      {
        _id: new ObjectId('512bc95fe835e68f199c8686'),
        author: 'dave',
        score: 80,
        views: 100,
      },
      {
        _id: new ObjectId('512bc962e835e68f199c8687'),
        author: 'dave',
        score: 85,
        views: 521,
      },
    ],
  )
})

test('$match', async t => {
  t.deepEqual(
    await aggregate(
      [
        {
          _id: new ObjectId('512bc95fe835e68f199c8686'),
          author: 'dave',
          score: 80,
          views: 100,
        },
        {
          _id: new ObjectId('512bc962e835e68f199c8687'),
          author: 'dave',
          score: 85,
          views: 521,
        },
        {
          _id: new ObjectId('55f5a192d4bede9ac365b257'),
          author: 'ahn',
          score: 60,
          views: 1000,
        },
        {
          _id: new ObjectId('55f5a192d4bede9ac365b258'),
          author: 'li',
          score: 55,
          views: 5000,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b259'),
          author: 'annT',
          score: 60,
          views: 50,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b25a'),
          author: 'li',
          score: 94,
          views: 999,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b25b'),
          author: 'ty',
          score: 95,
          views: 1000,
        },
      ],
      { $match: { author: 'dave' } },
    ),
    [
      {
        _id: new ObjectId('512bc95fe835e68f199c8686'),
        author: 'dave',
        score: 80,
        views: 100,
      },
      {
        _id: new ObjectId('512bc962e835e68f199c8687'),
        author: 'dave',
        score: 85,
        views: 521,
      },
    ],
  )
})

test('$skip', async t => {
  t.deepEqual(
    await aggregate(
      [
        {
          _id: new ObjectId('512bc95fe835e68f199c8686'),
          author: 'dave',
          score: 80,
          views: 100,
        },
        {
          _id: new ObjectId('512bc962e835e68f199c8687'),
          author: 'dave',
          score: 85,
          views: 521,
        },
        {
          _id: new ObjectId('55f5a192d4bede9ac365b257'),
          author: 'ahn',
          score: 60,
          views: 1000,
        },
        {
          _id: new ObjectId('55f5a192d4bede9ac365b258'),
          author: 'li',
          score: 55,
          views: 5000,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b259'),
          author: 'annT',
          score: 60,
          views: 50,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b25a'),
          author: 'li',
          score: 94,
          views: 999,
        },
        {
          _id: new ObjectId('55f5a1d3d4bede9ac365b25b'),
          author: 'ty',
          score: 95,
          views: 1000,
        },
      ],
      { $skip: 2 },
    ),
    [
      {
        _id: new ObjectId('55f5a192d4bede9ac365b257'),
        author: 'ahn',
        score: 60,
        views: 1000,
      },
      {
        _id: new ObjectId('55f5a192d4bede9ac365b258'),
        author: 'li',
        score: 55,
        views: 5000,
      },
      {
        _id: new ObjectId('55f5a1d3d4bede9ac365b259'),
        author: 'annT',
        score: 60,
        views: 50,
      },
      {
        _id: new ObjectId('55f5a1d3d4bede9ac365b25a'),
        author: 'li',
        score: 94,
        views: 999,
      },
      {
        _id: new ObjectId('55f5a1d3d4bede9ac365b25b'),
        author: 'ty',
        score: 95,
        views: 1000,
      },
    ],
  )
})

test('$unset', async t => {
  const documents = [
    {
      _id: 1,
      title: 'Antelope Antics',
      isbn: '0001122223334',
      author: { last: 'An', first: 'Auntie' },
      copies: [
        { warehouse: 'A', qty: 5 },
        { warehouse: 'B', qty: 15 },
      ],
    },
    {
      _id: 2,
      title: 'Bees Babble',
      isbn: '999999999333',
      author: { last: 'Bumble', first: 'Bee' },
      copies: [
        { warehouse: 'A', qty: 2 },
        { warehouse: 'B', qty: 5 },
      ],
    },
  ]
  t.deepEqual(await aggregate(documents, { $unset: 'copies' }), [
    {
      _id: 1,
      title: 'Antelope Antics',
      isbn: '0001122223334',
      author: { last: 'An', first: 'Auntie' },
    },
    {
      _id: 2,
      title: 'Bees Babble',
      isbn: '999999999333',
      author: { last: 'Bumble', first: 'Bee' },
    },
  ])
  t.deepEqual(await aggregate(documents, { $unset: ['copies'] }), [
    {
      _id: 1,
      title: 'Antelope Antics',
      isbn: '0001122223334',
      author: { last: 'An', first: 'Auntie' },
    },
    {
      _id: 2,
      title: 'Bees Babble',
      isbn: '999999999333',
      author: { last: 'Bumble', first: 'Bee' },
    },
  ])
  t.deepEqual(await aggregate(documents, { $unset: ['isbn', 'copies'] }), [
    {
      _id: 1,
      title: 'Antelope Antics',
      author: { last: 'An', first: 'Auntie' },
    },
    { _id: 2, title: 'Bees Babble', author: { last: 'Bumble', first: 'Bee' } },
  ])
  t.deepEqual(
    await aggregate(documents, {
      $unset: ['isbn', 'author.first', 'copies.warehouse'],
    }),
    [
      {
        _id: 1,
        title: 'Antelope Antics',
        author: { last: 'An' },
        copies: [{ qty: 5 }, { qty: 15 }],
      },
      {
        _id: 2,
        title: 'Bees Babble',
        author: { last: 'Bumble' },
        copies: [{ qty: 2 }, { qty: 5 }],
      },
    ],
  )
})

test('$unwind', async t => {
  t.deepEqual(
    await aggregate(
      { _id: 1, item: 'ABC1', sizes: ['S', 'M', 'L'] },
      { $unwind: '$sizes' },
    ),
    [
      { _id: 1, item: 'ABC1', sizes: 'S' },
      { _id: 1, item: 'ABC1', sizes: 'M' },
      { _id: 1, item: 'ABC1', sizes: 'L' },
    ],
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'Shirt', sizes: ['S', 'M', 'L'] },
        { _id: 2, item: 'Shorts', sizes: [] },
        { _id: 3, item: 'Hat', sizes: 'M' },
        { _id: 4, item: 'Gloves' },
        { _id: 5, item: 'Scarf', sizes: null },
      ],
      { $unwind: { path: '$sizes' } },
    ),
    [
      { _id: 1, item: 'Shirt', sizes: 'S' },
      { _id: 1, item: 'Shirt', sizes: 'M' },
      { _id: 1, item: 'Shirt', sizes: 'L' },
      { _id: 3, item: 'Hat', sizes: 'M' },
    ],
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'ABC', price: 80, sizes: ['S', 'M', 'L'] },
        { _id: 2, item: 'EFG', price: 120, sizes: [] },
        { _id: 3, item: 'IJK', price: 160, sizes: 'M' },
        { _id: 4, item: 'LMN', price: 10 },
        { _id: 5, item: 'XYZ', price: 5.75, sizes: null },
      ],
      { $unwind: { path: '$sizes', preserveNullAndEmptyArrays: true } },
    ),
    [
      { _id: 1, item: 'ABC', price: 80, sizes: 'S' },
      { _id: 1, item: 'ABC', price: 80, sizes: 'M' },
      { _id: 1, item: 'ABC', price: 80, sizes: 'L' },
      { _id: 2, item: 'EFG', price: 120 },
      { _id: 3, item: 'IJK', price: 160, sizes: 'M' },
      { _id: 4, item: 'LMN', price: 10 },
      { _id: 5, item: 'XYZ', price: 5.75, sizes: null },
    ],
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'ABC', price: 80, sizes: ['S', 'M', 'L'] },
        { _id: 2, item: 'EFG', price: 120, sizes: [] },
        { _id: 3, item: 'IJK', price: 160, sizes: 'M' },
        { _id: 4, item: 'LMN', price: 10 },
        { _id: 5, item: 'XYZ', price: 5.75, sizes: null },
      ],
      {
        $unwind: {
          path: '$sizes',
          includeArrayIndex: 'arrayIndex',
        },
      },
    ),
    [
      { _id: 1, item: 'ABC', price: 80, sizes: 'S', arrayIndex: 0 },
      { _id: 1, item: 'ABC', price: 80, sizes: 'M', arrayIndex: 1 },
      { _id: 1, item: 'ABC', price: 80, sizes: 'L', arrayIndex: 2 },
      { _id: 3, item: 'IJK', price: 160, sizes: 'M', arrayIndex: null },
    ],
  )
})

test('$set', async t => {
  // TODO: partial tests, see https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, type: 'car', specs: { doors: 4, wheels: 4 } },
        { _id: 2, type: 'motorcycle', specs: { doors: 0, wheels: 2 } },
        { _id: 3, type: 'jet ski' },
      ],
      { $set: { 'specs.fuel_type': 'unleaded' } },
    ),
    [
      {
        _id: 1,
        type: 'car',
        specs: { doors: 4, wheels: 4, fuel_type: 'unleaded' },
      },
      {
        _id: 2,
        type: 'motorcycle',
        specs: { doors: 0, wheels: 2, fuel_type: 'unleaded' },
      },
      { _id: 3, type: 'jet ski', specs: { fuel_type: 'unleaded' } },
    ],
  )
})
