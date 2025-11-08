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

test.todo('$elemMatch')

test.todo('$size')
