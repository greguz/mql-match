import test from 'ava'
import { ObjectId } from 'bson'

import { compileMatch } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/all/
 */
test('$all', t => {
  const articles = [
    { _id: 0, tags: [] },
    { _id: 1, tags: ['ssl', 'security'] },
    { _id: 2, tags: ['nested', ['ssl', 'security']] },
    { _id: 3, tags: ['ssl', 'docker', 'security'] },
    { _id: 4, tags: ['nested', ['ssl', 'docker', 'security']] },
    { _id: 5, tags: ['nothing', 'to', 'see'] },
  ]

  const inventory = [
    {
      _id: new ObjectId('5234cc89687ea597eabee675'),
      code: 'xyz',
      tags: ['school', 'book', 'bag', 'headphone', 'appliance'],
      qty: [
        { size: 'S', num: 10, color: 'blue' },
        { size: 'M', num: 45, color: 'blue' },
        { size: 'L', num: 100, color: 'green' },
      ],
    },
    {
      _id: new ObjectId('5234cc8a687ea597eabee676'),
      code: 'abc',
      tags: ['appliance', 'school', 'book'],
      qty: [
        { size: '6', num: 100, color: 'green' },
        { size: '6', num: 50, color: 'blue' },
        { size: '8', num: 100, color: 'brown' },
      ],
    },
    {
      _id: new ObjectId('5234ccb7687ea597eabee677'),
      code: 'efg',
      tags: ['school', 'book'],
      qty: [
        { size: 'S', num: 10, color: 'blue' },
        { size: 'M', num: 100, color: 'blue' },
        { size: 'L', num: 100, color: 'green' },
      ],
    },
    {
      _id: new ObjectId('52350353b2eff1353b349de9'),
      code: 'ijk',
      tags: ['electronics', 'school'],
      qty: [{ size: 'M', num: 100, color: 'green' }],
    },
  ]

  // Equivalent to $and Operation #1
  {
    const match = compileMatch({ tags: { $all: ['ssl', 'security'] } })

    t.deepEqual(articles.filter(match), [
      { _id: 1, tags: ['ssl', 'security'] },
      { _id: 3, tags: ['ssl', 'docker', 'security'] },
    ])
  }

  // Equivalent to $and Operation #2
  {
    const match = compileMatch({
      $and: [{ tags: 'ssl' }, { tags: 'security' }],
    })

    t.deepEqual(articles.filter(match), [
      { _id: 1, tags: ['ssl', 'security'] },
      { _id: 3, tags: ['ssl', 'docker', 'security'] },
    ])
  }

  // Nested Array #1
  {
    const match = compileMatch({ tags: { $all: [['ssl', 'security']] } })

    t.deepEqual(articles.filter(match), [
      { _id: 1, tags: ['ssl', 'security'] },
      { _id: 2, tags: ['nested', ['ssl', 'security']] },
    ])
  }

  // Nested Array #2
  {
    const match = compileMatch({ $and: [{ tags: ['ssl', 'security'] }] })

    t.deepEqual(articles.filter(match), [
      { _id: 1, tags: ['ssl', 'security'] },
      { _id: 2, tags: ['nested', ['ssl', 'security']] },
    ])
  }

  // Nested Array #3
  {
    const match = compileMatch({ tags: ['ssl', 'security'] })

    t.deepEqual(articles.filter(match), [
      { _id: 1, tags: ['ssl', 'security'] },
      { _id: 2, tags: ['nested', ['ssl', 'security']] },
    ])
  }

  // Empty Array #1
  {
    const match = compileMatch({ tags: { $all: [] } })

    // When passed an empty array, $all matches no documents.
    t.deepEqual(articles.filter(match), [])
  }

  // Empty Array #2
  {
    const match = compileMatch({ tags: { $eq: [] } })

    t.deepEqual(articles.filter(match), [{ _id: 0, tags: [] }])
  }

  // Use $all to Match Values
  {
    const match = compileMatch({
      tags: { $all: ['appliance', 'school', 'book'] },
    })

    t.deepEqual(inventory.filter(match), [
      {
        _id: new ObjectId('5234cc89687ea597eabee675'),
        code: 'xyz',
        tags: ['school', 'book', 'bag', 'headphone', 'appliance'],
        qty: [
          { size: 'S', num: 10, color: 'blue' },
          { size: 'M', num: 45, color: 'blue' },
          { size: 'L', num: 100, color: 'green' },
        ],
      },
      {
        _id: new ObjectId('5234cc8a687ea597eabee676'),
        code: 'abc',
        tags: ['appliance', 'school', 'book'],
        qty: [
          { size: '6', num: 100, color: 'green' },
          { size: '6', num: 50, color: 'blue' },
          { size: '8', num: 100, color: 'brown' },
        ],
      },
    ])
  }

  // Use $all with $elemMatch #1
  {
    const match = compileMatch({
      qty: {
        $all: [
          { $elemMatch: { size: 'M', num: { $gt: 50 } } },
          { $elemMatch: { num: 100, color: 'green' } },
        ],
      },
    })

    t.deepEqual(inventory.filter(match), [
      {
        _id: new ObjectId('5234ccb7687ea597eabee677'),
        code: 'efg',
        tags: ['school', 'book'],
        qty: [
          { size: 'S', num: 10, color: 'blue' },
          { size: 'M', num: 100, color: 'blue' },
          { size: 'L', num: 100, color: 'green' },
        ],
      },
      {
        _id: new ObjectId('52350353b2eff1353b349de9'),
        code: 'ijk',
        tags: ['electronics', 'school'],
        qty: [{ size: 'M', num: 100, color: 'green' }],
      },
    ])
  }

  // Use $all with $elemMatch #2
  {
    const match = compileMatch({ 'qty.num': { $all: [50] } })

    t.deepEqual(inventory.filter(match), [
      {
        _id: new ObjectId('5234cc8a687ea597eabee676'),
        code: 'abc',
        tags: ['appliance', 'school', 'book'],
        qty: [
          { size: '6', num: 100, color: 'green' },
          { size: '6', num: 50, color: 'blue' },
          { size: '8', num: 100, color: 'brown' },
        ],
      },
    ])
  }

  // Use $all with $elemMatch #3
  {
    const match = compileMatch({ 'qty.num': 50 })

    t.deepEqual(inventory.filter(match), [
      {
        _id: new ObjectId('5234cc8a687ea597eabee676'),
        code: 'abc',
        tags: ['appliance', 'school', 'book'],
        qty: [
          { size: '6', num: 100, color: 'green' },
          { size: '6', num: 50, color: 'blue' },
          { size: '8', num: 100, color: 'brown' },
        ],
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/
 */
test('$elemMatch', t => {
  const scores = [
    { _id: 1, results: [82, 85, 88] },
    { _id: 2, results: [75, 88, 89] },
  ]

  const survey = [
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
    { _id: 5, results: { product: 'xyz', score: 7 } },
  ]

  // Element Match
  {
    const match = compileMatch({
      results: { $elemMatch: { $gte: 80, $lt: 85 } },
    })

    t.deepEqual(scores.filter(match), [{ _id: 1, results: [82, 85, 88] }])
  }

  // Array of Embedded Documents
  {
    const match = compileMatch({
      results: { $elemMatch: { product: 'xyz', score: { $gte: 8 } } },
    })

    t.deepEqual(survey.filter(match), [
      {
        _id: 3,
        results: [
          { product: 'abc', score: 7 },
          { product: 'xyz', score: 8 },
        ],
      },
    ])
  }

  // Single Query Condition
  {
    const match = compileMatch({ results: { $elemMatch: { product: 'xyz' } } })

    t.deepEqual(survey.filter(match), [
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
    ])
  }

  // Single Query Condition
  {
    const match = compileMatch({ 'results.product': 'xyz' })

    t.deepEqual(survey.filter(match), [
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
      { _id: 5, results: { product: 'xyz', score: 7 } },
    ])
  }

  // Single Query Condition
  {
    const match = compileMatch({
      results: { $elemMatch: { product: { $ne: 'xyz' } } },
    })

    t.deepEqual(survey.filter(match), [
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
    ])
  }

  // Single Query Condition
  {
    const match = compileMatch({ 'results.product': { $ne: 'xyz' } })

    t.deepEqual(survey.filter(match), [
      {
        _id: 4,
        results: [
          { product: 'abc', score: 7 },
          { product: 'def', score: 8 },
        ],
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/size/
 */
test('$size', t => {
  const match = compileMatch({ field: { $size: 2 } })

  t.false(match({ field: [] }))
  t.false(match({ field: ['a'] }))
  t.true(match({ field: ['a', 'b'] }))
  t.false(match({ field: ['a', 'b', 'c'] }))
})
