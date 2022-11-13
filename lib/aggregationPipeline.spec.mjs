import test from 'ava'
import { ObjectId } from 'bson'

import { compileAggregationPipeline } from './aggregationPipeline.mjs'

async function aggregate (documents, stages) {
  if (!Array.isArray(documents)) {
    documents = [documents]
  }
  if (!Array.isArray(stages)) {
    stages = [stages]
  }
  const results = []
  const aggregate = compileAggregationPipeline(stages)
  for await (const document of aggregate(documents)) {
    results.push(document)
  }
  return results
}

test('aggregate:$count', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, subject: 'History', score: 88 },
        { _id: 2, subject: 'History', score: 92 },
        { _id: 3, subject: 'History', score: 97 },
        { _id: 4, subject: 'History', score: 71 },
        { _id: 5, subject: 'History', score: 79 },
        { _id: 6, subject: 'History', score: 83 }
      ],
      [
        {
          $match: {
            score: {
              $gt: 80
            }
          }
        },
        {
          $count: 'passing_scores'
        }
      ]
    ),
    [
      { passing_scores: 4 }
    ]
  )
})

test('aggregate:$limit', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
        { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 },
        { _id: new ObjectId('55f5a192d4bede9ac365b257'), author: 'ahn', score: 60, views: 1000 },
        { _id: new ObjectId('55f5a192d4bede9ac365b258'), author: 'li', score: 55, views: 5000 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b259'), author: 'annT', score: 60, views: 50 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25a'), author: 'li', score: 94, views: 999 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25b'), author: 'ty', score: 95, views: 1000 }
      ],
      { $limit: 2 }
    ),
    [
      { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
      { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 }
    ]
  )
})

test('aggregate:$match', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
        { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 },
        { _id: new ObjectId('55f5a192d4bede9ac365b257'), author: 'ahn', score: 60, views: 1000 },
        { _id: new ObjectId('55f5a192d4bede9ac365b258'), author: 'li', score: 55, views: 5000 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b259'), author: 'annT', score: 60, views: 50 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25a'), author: 'li', score: 94, views: 999 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25b'), author: 'ty', score: 95, views: 1000 }
      ],
      { $match: { author: 'dave' } }
    ),
    [
      { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
      { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 }
    ]
  )
})

test('aggregate:$skip', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
        { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 },
        { _id: new ObjectId('55f5a192d4bede9ac365b257'), author: 'ahn', score: 60, views: 1000 },
        { _id: new ObjectId('55f5a192d4bede9ac365b258'), author: 'li', score: 55, views: 5000 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b259'), author: 'annT', score: 60, views: 50 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25a'), author: 'li', score: 94, views: 999 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25b'), author: 'ty', score: 95, views: 1000 }
      ],
      { $skip: 2 }
    ),
    [
      { _id: new ObjectId('55f5a192d4bede9ac365b257'), author: 'ahn', score: 60, views: 1000 },
      { _id: new ObjectId('55f5a192d4bede9ac365b258'), author: 'li', score: 55, views: 5000 },
      { _id: new ObjectId('55f5a1d3d4bede9ac365b259'), author: 'annT', score: 60, views: 50 },
      { _id: new ObjectId('55f5a1d3d4bede9ac365b25a'), author: 'li', score: 94, views: 999 },
      { _id: new ObjectId('55f5a1d3d4bede9ac365b25b'), author: 'ty', score: 95, views: 1000 }
    ]
  )
})

test('aggregate:$unset', async t => {
  const documents = [
    {
      _id: 1,
      title: 'Antelope Antics',
      isbn: '0001122223334',
      author: { last: 'An', first: 'Auntie' },
      copies: [{ warehouse: 'A', qty: 5 }, { warehouse: 'B', qty: 15 }]
    },
    {
      _id: 2,
      title: 'Bees Babble',
      isbn: '999999999333',
      author: { last: 'Bumble', first: 'Bee' },
      copies: [{ warehouse: 'A', qty: 2 }, { warehouse: 'B', qty: 5 }]
    }
  ]
  t.deepEqual(
    await aggregate(
      documents,
      { $unset: 'copies' }
    ),
    [
      { _id: 1, title: 'Antelope Antics', isbn: '0001122223334', author: { last: 'An', first: 'Auntie' } },
      { _id: 2, title: 'Bees Babble', isbn: '999999999333', author: { last: 'Bumble', first: 'Bee' } }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      { $unset: ['copies'] }
    ),
    [
      { _id: 1, title: 'Antelope Antics', isbn: '0001122223334', author: { last: 'An', first: 'Auntie' } },
      { _id: 2, title: 'Bees Babble', isbn: '999999999333', author: { last: 'Bumble', first: 'Bee' } }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      { $unset: ['isbn', 'copies'] }
    ),
    [
      { _id: 1, title: 'Antelope Antics', author: { last: 'An', first: 'Auntie' } },
      { _id: 2, title: 'Bees Babble', author: { last: 'Bumble', first: 'Bee' } }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      { $unset: ['isbn', 'author.first', 'copies.warehouse'] }
    ),
    [
      { _id: 1, title: 'Antelope Antics', author: { last: 'An' }, copies: [{ qty: 5 }, { qty: 15 }] },
      { _id: 2, title: 'Bees Babble', author: { last: 'Bumble' }, copies: [{ qty: 2 }, { qty: 5 }] }
    ]
  )
})

test('aggregate:$unwind', async t => {
  t.deepEqual(
    await aggregate(
      { _id: 1, item: 'ABC1', sizes: ['S', 'M', 'L'] },
      { $unwind: '$sizes' }
    ),
    [
      { _id: 1, item: 'ABC1', sizes: 'S' },
      { _id: 1, item: 'ABC1', sizes: 'M' },
      { _id: 1, item: 'ABC1', sizes: 'L' }
    ]
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'Shirt', sizes: ['S', 'M', 'L'] },
        { _id: 2, item: 'Shorts', sizes: [] },
        { _id: 3, item: 'Hat', sizes: 'M' },
        { _id: 4, item: 'Gloves' },
        { _id: 5, item: 'Scarf', sizes: null }
      ],
      { $unwind: { path: '$sizes' } }
    ),
    [
      { _id: 1, item: 'Shirt', sizes: 'S' },
      { _id: 1, item: 'Shirt', sizes: 'M' },
      { _id: 1, item: 'Shirt', sizes: 'L' },
      { _id: 3, item: 'Hat', sizes: 'M' }
    ]
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'ABC', price: 80, sizes: ['S', 'M', 'L'] },
        { _id: 2, item: 'EFG', price: 120, sizes: [] },
        { _id: 3, item: 'IJK', price: 160, sizes: 'M' },
        { _id: 4, item: 'LMN', price: 10 },
        { _id: 5, item: 'XYZ', price: 5.75, sizes: null }
      ],
      { $unwind: { path: '$sizes', preserveNullAndEmptyArrays: true } }
    ),
    [
      { _id: 1, item: 'ABC', price: 80, sizes: 'S' },
      { _id: 1, item: 'ABC', price: 80, sizes: 'M' },
      { _id: 1, item: 'ABC', price: 80, sizes: 'L' },
      { _id: 2, item: 'EFG', price: 120 },
      { _id: 3, item: 'IJK', price: 160, sizes: 'M' },
      { _id: 4, item: 'LMN', price: 10 },
      { _id: 5, item: 'XYZ', price: 5.75, sizes: null }
    ]
  )
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, item: 'ABC', price: 80, sizes: ['S', 'M', 'L'] },
        { _id: 2, item: 'EFG', price: 120, sizes: [] },
        { _id: 3, item: 'IJK', price: 160, sizes: 'M' },
        { _id: 4, item: 'LMN', price: 10 },
        { _id: 5, item: 'XYZ', price: 5.75, sizes: null }
      ],
      {
        $unwind: {
          path: '$sizes',
          includeArrayIndex: 'arrayIndex'
        }
      }
    ),
    [
      { _id: 1, item: 'ABC', price: 80, sizes: 'S', arrayIndex: 0 },
      { _id: 1, item: 'ABC', price: 80, sizes: 'M', arrayIndex: 1 },
      { _id: 1, item: 'ABC', price: 80, sizes: 'L', arrayIndex: 2 },
      { _id: 3, item: 'IJK', price: 160, sizes: 'M', arrayIndex: null }
    ]
  )
})

test('aggregate:$set', async t => {
  // TODO: partial tests, see https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, type: 'car', specs: { doors: 4, wheels: 4 } },
        { _id: 2, type: 'motorcycle', specs: { doors: 0, wheels: 2 } },
        { _id: 3, type: 'jet ski' }
      ],
      { $set: { 'specs.fuel_type': 'unleaded' } }
    ),
    [
      { _id: 1, type: 'car', specs: { doors: 4, wheels: 4, fuel_type: 'unleaded' } },
      { _id: 2, type: 'motorcycle', specs: { doors: 0, wheels: 2, fuel_type: 'unleaded' } },
      { _id: 3, type: 'jet ski', specs: { fuel_type: 'unleaded' } }
    ]
  )
})

test('aggregate:$project:$abs', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, start: 5, end: 8 },
        { _id: 2, start: 4, end: 4 },
        { _id: 3, start: 9, end: 7 },
        { _id: 4, start: 6, end: 7 }
      ],
      { $project: { delta: { $abs: { $subtract: ['$start', '$end'] } } } }
    ),
    [
      { _id: 1, delta: 3 },
      { _id: 2, delta: 0 },
      { _id: 3, delta: 2 },
      { _id: 4, delta: 1 }
    ]
  )
})

test('aggregate:$project:$add', async t => {
  const documents = [
    { _id: 1, item: 'abc', price: 10, fee: 2, date: new Date('2014-03-01T08:00:00Z') },
    { _id: 2, item: 'jkl', price: 20, fee: 1, date: new Date('2014-03-01T09:00:00Z') },
    { _id: 3, item: 'xyz', price: 5, fee: 0, date: new Date('2014-03-15T09:00:00Z') }
  ]
  t.deepEqual(
    await aggregate(
      documents,
      { $project: { item: 1, total: { $add: ['$price', '$fee'] } } }
    ),
    [
      { _id: 1, item: 'abc', total: 12 },
      { _id: 2, item: 'jkl', total: 21 },
      { _id: 3, item: 'xyz', total: 5 }
    ]
  )
  t.deepEqual(
    await aggregate(
      documents,
      { $project: { item: 1, billing_date: { $add: ['$date', 3 * 24 * 60 * 60000] } } }
    ),
    [
      { _id: 1, item: 'abc', billing_date: new Date('2014-03-04T08:00:00Z') },
      { _id: 2, item: 'jkl', billing_date: new Date('2014-03-04T09:00:00Z') },
      { _id: 3, item: 'xyz', billing_date: new Date('2014-03-18T09:00:00Z') }
    ]
  )
})

test('aggregate:$project:$ceil', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, value: 9.25 },
        { _id: 2, value: 8.73 },
        { _id: 3, value: 4.32 },
        { _id: 4, value: -5.34 }
      ],
      { $project: { value: 1, ceilingValue: { $ceil: '$value' } } }
    ),
    [
      { _id: 1, value: 9.25, ceilingValue: 10 },
      { _id: 2, value: 8.73, ceilingValue: 9 },
      { _id: 3, value: 4.32, ceilingValue: 5 },
      { _id: 4, value: -5.34, ceilingValue: -5 }
    ]
  )
})
