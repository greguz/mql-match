import test from 'ava'

import { compileFilterQuery, compileUpdateQuery } from '../../exports.js'

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
    const match = compileFilterQuery({ qty: { $eq: 20 } })

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
    const match = compileFilterQuery({ qty: 20 })

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
    const match = compileFilterQuery({ 'item.name': { $eq: 'ab' } })

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
    const match = compileFilterQuery({ 'item.name': 'ab' })

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
    const match = compileFilterQuery({ tags: { $eq: 'B' } })

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
    const match = compileFilterQuery({ tags: 'B' })

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
    const match = compileFilterQuery({ tags: { $eq: ['A', 'B'] } })

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
    const match = compileFilterQuery({ tags: ['A', 'B'] })

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
    const match = compileFilterQuery({ company: 'MongoDB' })

    t.deepEqual(companies.filter(match), [{ _id: 1, company: 'MongoDB' }])
  }

  // Regex Match Behaviour: $eq match on a string
  {
    const match = compileFilterQuery({ company: { $eq: 'MongoDB' } })

    t.deepEqual(companies.filter(match), [{ _id: 1, company: 'MongoDB' }])
  }

  // Regex Match Behaviour: $eq match on a regular expression
  {
    const match = compileFilterQuery({ company: { $eq: /MongoDB/ } })

    // An explicit query using $eq and a regular expression will only match an object which is also a regular expression.
    t.deepEqual(companies.filter(match), [])
  }

  // Regex Match Behaviour: Regular expression matches
  {
    const match = compileFilterQuery({ company: /MongoDB/ })

    t.deepEqual(companies.filter(match), [
      { _id: 1, company: 'MongoDB' },
      { _id: 2, company: 'MongoDB2' },
    ])
  }

  // Regex Match Behaviour: Regular expression matches
  {
    const match = compileFilterQuery({ company: { $regex: /MongoDB/ } })

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
test('$in', t => {
  const inventory = [
    { item: 'Pens', quantity: 350, tags: ['school', 'office'] },
    { item: 'Erasers', quantity: 15, tags: ['school', 'home'] },
    { item: 'Maps', tags: ['office', 'storage'] },
    { item: 'Books', quantity: 5, tags: ['school', 'storage', 'home'] },
  ]

  // Use the $in Operator to Match Values
  {
    const match = compileFilterQuery({ quantity: { $in: [5, 15] } })

    t.deepEqual(inventory.filter(match), [
      { item: 'Erasers', quantity: 15, tags: ['school', 'home'] },
      { item: 'Books', quantity: 5, tags: ['school', 'storage', 'home'] },
    ])
  }

  // Use the $in Operator to Match Values in an Array
  {
    const match = compileFilterQuery({ tags: { $in: ['home', 'school'] } })
    const update = compileUpdateQuery({ $set: { exclude: false } })

    t.deepEqual(inventory.filter(match).map(update), [
      {
        item: 'Pens',
        quantity: 350,
        tags: ['school', 'office'],
        exclude: false,
      },
      {
        item: 'Erasers',
        quantity: 15,
        tags: ['school', 'home'],
        exclude: false,
      },
      {
        item: 'Books',
        quantity: 5,
        tags: ['school', 'storage', 'home'],
        exclude: false,
      },
    ])
  }

  // Use the $in Operator with a Regular Expression
  {
    const match = compileFilterQuery({ tags: { $in: [/^be/, /^st/] } })

    t.deepEqual(inventory.filter(match), [
      { item: 'Maps', tags: ['office', 'storage'] },
      {
        item: 'Books',
        exclude: false,
        quantity: 5,
        tags: ['school', 'storage', 'home'],
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/lt/
 */
test('$lt', t => {
  const inventory = [
    {
      item: 'nuts',
      quantity: 30,
      carrier: { name: 'Shipit', fee: 3 },
    },
    {
      item: 'bolts',
      quantity: 50,
      carrier: { name: 'Shipit', fee: 4 },
    },
    {
      item: 'washers',
      quantity: 10,
      carrier: { name: 'Shipit', fee: 1 },
    },
  ]

  // Match Document Fields
  {
    const match = compileFilterQuery({ quantity: { $lt: 20 } })

    t.deepEqual(inventory.filter(match), [
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
      },
    ])
  }

  // Perform an Update Based on Embedded Document Fields
  {
    const match = compileFilterQuery({ 'carrier.fee': { $lt: 20 } })
    const update = compileUpdateQuery({ $set: { price: 9.99 } })
    inventory.filter(match).forEach(update)

    t.deepEqual(inventory, [
      {
        item: 'nuts',
        quantity: 30,
        carrier: { name: 'Shipit', fee: 3 },
        price: 9.99,
      },
      {
        item: 'bolts',
        quantity: 50,
        carrier: { name: 'Shipit', fee: 4 },
        price: 9.99,
      },
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
        price: 9.99,
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/lte/
 */
test.todo('$lte')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/ne/
 */
test('$ne', t => {
  const inventory = [
    {
      item: 'nuts',
      quantity: 30,
      carrier: { name: 'Shipit', fee: 3 },
    },
    {
      item: 'bolts',
      quantity: 50,
      carrier: { name: 'Shipit', fee: 4 },
    },
    {
      item: 'washers',
      quantity: 10,
      carrier: { name: 'Shipit', fee: 1 },
    },
  ]

  // Match Document Fields That Are Not Equal
  {
    const match = compileFilterQuery({ quantity: { $ne: 20 } })

    t.deepEqual(inventory.filter(match), [
      {
        item: 'nuts',
        quantity: 30,
        carrier: { name: 'Shipit', fee: 3 },
      },
      {
        item: 'bolts',
        quantity: 50,
        carrier: { name: 'Shipit', fee: 4 },
      },
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
      },
    ])
  }

  // Update Based on Not Equal Embedded Document Fields
  {
    const match = compileFilterQuery({ 'carrier.fee': { $ne: 1 } })

    const update = compileUpdateQuery({ $set: { price: 9.99 } })

    for (const doc of inventory) {
      if (match(doc)) {
        update(doc)
      }
    }

    t.deepEqual(inventory, [
      {
        item: 'nuts',
        quantity: 30,
        carrier: { name: 'Shipit', fee: 3 },
        price: 9.99,
      },
      {
        item: 'bolts',
        quantity: 50,
        carrier: { name: 'Shipit', fee: 4 },
        price: 9.99,
      },
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
      },
    ])
  }

  // Arrays
  {
    const match = compileFilterQuery({ item: 'nuts' })
    const update = compileUpdateQuery({ $set: { type: ['hardware'] } })
    for (const doc of inventory) {
      if (match(doc)) {
        update(doc)
      }
    }
  }

  // Arrays
  {
    const match = compileFilterQuery({ item: 'bolts' })
    const update = compileUpdateQuery({
      $set: { type: ['hardware', 'fasteners'] },
    })
    for (const doc of inventory) {
      if (match(doc)) {
        update(doc)
      }
    }
  }

  // Arrays
  {
    const match = compileFilterQuery({
      type: { $ne: ['hardware', 'fasteners'] },
    })

    t.deepEqual(inventory.filter(match), [
      {
        item: 'nuts',
        price: 9.99,
        quantity: 30,
        carrier: { name: 'Shipit', fee: 3 },
        type: ['hardware'],
      },
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
      },
    ])
  }

  // Arrays
  {
    const match = compileFilterQuery({
      type: { $ne: ['fasteners', 'hardware'] },
    })

    t.deepEqual(inventory.filter(match), [
      {
        item: 'nuts',
        price: 9.99,
        quantity: 30,
        carrier: { name: 'Shipit', fee: 3 },
        type: ['hardware'],
      },
      {
        item: 'bolts',
        price: 9.99,
        quantity: 50,
        carrier: { name: 'Shipit', fee: 4 },
        type: ['hardware', 'fasteners'],
      },
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
      },
    ])
  }

  // Arrays
  {
    const match = compileFilterQuery({ type: { $ne: 'fasteners' } })

    t.deepEqual(inventory.filter(match), [
      {
        item: 'nuts',
        price: 9.99,
        quantity: 30,
        carrier: { name: 'Shipit', fee: 3 },
        type: ['hardware'],
      },
      {
        item: 'washers',
        quantity: 10,
        carrier: { name: 'Shipit', fee: 1 },
      },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/nin/
 */
test('$nin', t => {
  const inventory = [
    { item: 'Pens', quantity: 350, tags: ['school', 'office'] },
    { item: 'Erasers', quantity: 15, tags: ['school', 'home'] },
    { item: 'Maps', tags: ['office', 'storage'] },
    { item: 'Books', quantity: 5, tags: ['school', 'storage', 'home'] },
  ]

  // Select on Unmatching Documents
  {
    const match = compileFilterQuery({ quantity: { $nin: [5, 15] } })

    t.deepEqual(inventory.filter(match), [
      { item: 'Pens', quantity: 350, tags: ['school', 'office'] },
      { item: 'Maps', tags: ['office', 'storage'] },
    ])
  }

  // Select on Elements Not in an Array
  {
    const match = compileFilterQuery({ tags: { $nin: ['school'] } })

    const update = compileUpdateQuery({ $set: { exclude: true } })

    for (const doc of inventory) {
      if (match(doc)) {
        update(doc)
      }
    }

    t.deepEqual(inventory, [
      { item: 'Pens', quantity: 350, tags: ['school', 'office'] },
      { item: 'Erasers', quantity: 15, tags: ['school', 'home'] },
      { item: 'Maps', tags: ['office', 'storage'], exclude: true },
      { item: 'Books', quantity: 5, tags: ['school', 'storage', 'home'] },
    ])
  }
})
