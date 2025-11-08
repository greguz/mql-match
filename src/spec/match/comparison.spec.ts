import test from 'ava'

import { compileMatch } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/eq/
 */
test('$eq', t => {
  const inventory = [
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

  const companies = [
    { _id: 1, company: 'MongoDB' },
    { _id: 2, company: 'MongoDB2' },
  ]

  // Equals a Specified Value
  {
    const match = compileMatch({ qty: { $eq: 20 } })

    t.deepEqual(inventory.filter(match), [
      { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
      {
        _id: 5,
        item: { name: 'mn', code: '000' },
        qty: 20,
        tags: [['A', 'B'], 'C'],
      },
    ])
  }

  // Equals a Specified Value
  {
    const match = compileMatch({ qty: 20 })

    t.deepEqual(inventory.filter(match), [
      { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
      {
        _id: 5,
        item: { name: 'mn', code: '000' },
        qty: 20,
        tags: [['A', 'B'], 'C'],
      },
    ])
  }

  // Field in Embedded Document Equals a Value
  {
    const match = compileMatch({ 'item.name': { $eq: 'ab' } })

    t.deepEqual(inventory.filter(match), [
      {
        _id: 1,
        item: { name: 'ab', code: '123' },
        qty: 15,
        tags: ['A', 'B', 'C'],
      },
    ])
  }

  // Field in Embedded Document Equals a Value
  {
    const match = compileMatch({ 'item.name': 'ab' })

    t.deepEqual(inventory.filter(match), [
      {
        _id: 1,
        item: { name: 'ab', code: '123' },
        qty: 15,
        tags: ['A', 'B', 'C'],
      },
    ])
  }

  // Array Element Equals a Value
  {
    const match = compileMatch({ tags: { $eq: 'B' } })

    t.deepEqual(inventory.filter(match), [
      {
        _id: 1,
        item: { name: 'ab', code: '123' },
        qty: 15,
        tags: ['A', 'B', 'C'],
      },
      { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
      { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
      { _id: 4, item: { name: 'xy', code: '456' }, qty: 30, tags: ['B', 'A'] },
    ])
  }

  // Array Element Equals a Value
  {
    const match = compileMatch({ tags: 'B' })

    t.deepEqual(inventory.filter(match), [
      {
        _id: 1,
        item: { name: 'ab', code: '123' },
        qty: 15,
        tags: ['A', 'B', 'C'],
      },
      { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
      { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
      { _id: 4, item: { name: 'xy', code: '456' }, qty: 30, tags: ['B', 'A'] },
    ])
  }

  // Equals an Array Value
  {
    const match = compileMatch({ tags: { $eq: ['A', 'B'] } })

    t.deepEqual(inventory.filter(match), [
      { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
      {
        _id: 5,
        item: { name: 'mn', code: '000' },
        qty: 20,
        tags: [['A', 'B'], 'C'],
      },
    ])
  }

  // Equals an Array Value
  {
    const match = compileMatch({ tags: ['A', 'B'] })

    t.deepEqual(inventory.filter(match), [
      { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
      {
        _id: 5,
        item: { name: 'mn', code: '000' },
        qty: 20,
        tags: [['A', 'B'], 'C'],
      },
    ])
  }

  // Regex Match Behaviour: $eq match on a string
  {
    const match = compileMatch({ company: 'MongoDB' })

    t.deepEqual(companies.filter(match), [{ _id: 1, company: 'MongoDB' }])
  }

  // Regex Match Behaviour: $eq match on a string
  {
    const match = compileMatch({ company: { $eq: 'MongoDB' } })

    t.deepEqual(companies.filter(match), [{ _id: 1, company: 'MongoDB' }])
  }

  // Regex Match Behaviour: $eq match on a regular expression
  {
    const match = compileMatch({ company: { $eq: /MongoDB/ } })

    // An explicit query using $eq and a regular expression will only match an object which is also a regular expression.
    t.deepEqual(companies.filter(match), [])
  }

  // Regex Match Behaviour: Regular expression matches
  {
    const match = compileMatch({ company: /MongoDB/ })

    t.deepEqual(companies.filter(match), [
      { _id: 1, company: 'MongoDB' },
      { _id: 2, company: 'MongoDB2' },
    ])
  }

  // Regex Match Behaviour: Regular expression matches
  {
    const match = compileMatch({ company: { $regex: /MongoDB/ } })

    t.deepEqual(companies.filter(match), [
      { _id: 1, company: 'MongoDB' },
      { _id: 2, company: 'MongoDB2' },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/gt/
 */
test.todo('$gt')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/gte/
 */
test.todo('$gte')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/in/
 */
test.todo('$in')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/lt/
 */
test.todo('$lt')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/lte/
 */
test.todo('$lte')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/ne/
 */
test.todo('$ne')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/nin/
 */
test.todo('$nin')
