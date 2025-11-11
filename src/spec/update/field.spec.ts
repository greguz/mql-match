import test from 'ava'
import { Int32, Timestamp } from 'bson'

import { compileFilterQuery, compileUpdateQuery } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/currentDate/
 */
test('$currentDate', t => {
  // Example
  {
    const doc = {
      _id: 1,
      status: 'a',
      lastModified: new Date('2013-10-02T01:11:18.965Z'),
    }

    const update = compileUpdateQuery({
      $currentDate: {
        lastModified: true,
        'cancellation.date': { $type: 'timestamp' },
      },
      $set: {
        'cancellation.reason': 'user request',
        status: 'D',
      },
    })
    update(doc)

    t.like(doc, {
      _id: 1,
      status: 'D',
      lastModified: {
        constructor: Date,
      },
      cancellation: {
        date: {
          constructor: Timestamp,
        },
        reason: 'user request',
      },
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/inc/
 */
test('$inc', t => {
  const doc = {
    _id: 1,
    sku: 'abc123',
    quantity: 10,
    metrics: { orders: 2, ratings: 3.5 },
  }

  const update = compileUpdateQuery({
    $inc: { quantity: -2, 'metrics.orders': 1 },
  })
  update(doc)

  t.deepEqual(doc, {
    _id: 1,
    sku: 'abc123',
    quantity: 8,
    metrics: { orders: 3, ratings: 3.5 },
  })
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/min/
 */
test('$min', t => {
  // Examples: Use $min to Compare Numbers
  {
    const doc = { _id: 1, highScore: 800, lowScore: 200 }

    const doUpdate = compileUpdateQuery({ $min: { lowScore: 150 } })
    doUpdate(doc)

    t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })

    const noUpdate = compileUpdateQuery({ $min: { lowScore: 250 } })
    noUpdate(doc)

    t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })
  }

  // Examples: Use $min to Compare Dates
  {
    const doc = {
      _id: 1,
      desc: 'crafts',
      dateEntered: new Date('2013-10-01T05:00:00Z'),
      dateExpired: new Date('2013-10-01T16:38:16Z'),
    }

    const update = compileUpdateQuery({
      $min: { dateEntered: new Date('2013-09-25') },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 1,
      desc: 'crafts',
      dateEntered: new Date('2013-09-25T00:00:00Z'),
      dateExpired: new Date('2013-10-01T16:38:16Z'),
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/max/
 */
test('$max', t => {
  // Use $max to Compare Numbers
  {
    const doc = { _id: 1, highScore: 800, lowScore: 200 }

    const doUpdate = compileUpdateQuery({ $max: { highScore: 950 } })
    doUpdate(doc)

    t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })

    const noUpdate = compileUpdateQuery({ $max: { highScore: 870 } })
    noUpdate(doc)

    t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })
  }

  // Use $max to Compare Dates
  {
    const doc = {
      _id: 1,
      desc: 'decorative arts',
      dateEntered: new Date('2013-10-01T05:00:00Z'),
      dateExpired: new Date('2013-10-01T16:38:16.163Z'),
    }

    const update = compileUpdateQuery({
      $max: { dateExpired: new Date('2013-09-30') },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 1,
      desc: 'decorative arts',
      dateEntered: new Date('2013-10-01T05:00:00Z'),
      dateExpired: new Date('2013-10-01T16:38:16.163Z'),
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/mul/
 */
test('$mul', t => {
  // Multiply the Value of a Field
  {
    const doc = { _id: 1, item: 'Hats', price: 10.99, quantity: 25 }

    const update = compileUpdateQuery({
      $mul: {
        price: 1.25,
        quantity: 2,
      },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 1,
      item: 'Hats',
      price: 13.7375,
      quantity: 50,
    })
  }

  // Apply $mul Operator to a Non-existing Field
  {
    const doc = { _id: 2, item: 'Unknown' }

    const update = compileUpdateQuery({ $mul: { price: 100 } })
    update(doc)

    t.deepEqual(doc, { _id: 2, item: 'Unknown', price: 0 })
  }

  // Multiply Mixed Numeric Types
  {
    const doc = { _id: 3, item: 'Scarf', price: 10 }

    const update = compileUpdateQuery({ $mul: { price: new Int32(5) } })
    update(doc)

    t.deepEqual(doc, { _id: 3, item: 'Scarf', price: 50 })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/rename/
 */
test('$rename', t => {
  const students = [
    {
      _id: 1,
      alias: ['The American Cincinnatus', 'The American Fabius'],
      mobile: '555-555-5555',
      nmae: { first: 'george', last: 'washington' },
    },
    {
      _id: 2,
      alias: ['My dearest friend'],
      mobile: '222-222-2222',
      nmae: { first: 'abigail', last: 'adams' },
    },
    {
      _id: 3,
      alias: ['Amazing grace'],
      mobile: '111-111-1111',
      nmae: { first: 'grace', last: 'hopper' },
    },
  ]

  // Rename a Field
  {
    const update = compileUpdateQuery({ $rename: { nmae: 'name' } })
    students.forEach(update)

    t.deepEqual(students, [
      {
        _id: 1,
        alias: ['The American Cincinnatus', 'The American Fabius'],
        mobile: '555-555-5555',
        name: { first: 'george', last: 'washington' },
      },
      {
        _id: 2,
        alias: ['My dearest friend'],
        mobile: '222-222-2222',
        name: { first: 'abigail', last: 'adams' },
      },
      {
        _id: 3,
        alias: ['Amazing grace'],
        mobile: '111-111-1111',
        name: { first: 'grace', last: 'hopper' },
      },
    ])
  }

  // Rename a Field in an Embedded Document
  {
    const update = compileUpdateQuery({
      $rename: { 'name.first': 'name.fname' },
    })
    update(students[0])

    t.deepEqual(students[0], {
      _id: 1,
      alias: ['The American Cincinnatus', 'The American Fabius'],
      mobile: '555-555-5555',
      name: { last: 'washington', fname: 'george' },
    })
  }

  // Rename a Field That Does Not Exist
  {
    const update = compileUpdateQuery({ $rename: { wife: 'spouse' } })
    update(students[0])

    t.deepEqual(students[0], {
      _id: 1,
      alias: ['The American Cincinnatus', 'The American Fabius'],
      mobile: '555-555-5555',
      name: { last: 'washington', fname: 'george' },
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/set/
 */
test('$set', t => {
  const doc = {
    _id: 100,
    quantity: 250,
    instock: true,
    reorder: false,
    details: { model: '14QQ', make: 'Clothes Corp' },
    tags: ['apparel', 'clothing'],
    ratings: [{ by: 'Customer007', rating: 4 }],
  }

  // Set Top-Level Fields
  {
    const update = compileUpdateQuery({
      $set: {
        quantity: 500,
        details: { model: '2600', make: 'Fashionaires' },
        tags: ['coats', 'outerwear', 'clothing'],
      },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: '2600', make: 'Fashionaires' },
      tags: ['coats', 'outerwear', 'clothing'],
      ratings: [{ by: 'Customer007', rating: 4 }],
    })
  }

  // Set Fields in Embedded Documents
  {
    const update = compileUpdateQuery({
      $set: { 'details.make': 'Kustom Kidz' },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: '2600', make: 'Kustom Kidz' },
      tags: ['coats', 'outerwear', 'clothing'],
      ratings: [{ by: 'Customer007', rating: 4 }],
    })
  }

  // Set Elements in Arrays
  {
    const update = compileUpdateQuery({
      $set: {
        'tags.1': 'rain gear',
        'ratings.0.rating': 2,
      },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: '2600', make: 'Kustom Kidz' },
      tags: ['coats', 'rain gear', 'clothing'],
      ratings: [{ by: 'Customer007', rating: 2 }],
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/setOnInsert/
 */
test.todo('$setOnInsert')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/unset/
 */
test('$unset', t => {
  const products = [
    { item: 'chisel', sku: 'C001', quantity: 4, instock: true },
    { item: 'hammer', sku: 'unknown', quantity: 3, instock: true },
    { item: 'nails', sku: 'unknown', quantity: 100, instock: true },
  ]

  const update = compileUpdateQuery({ $unset: { quantity: '', instock: '' } })

  const match = compileFilterQuery({ sku: 'unknown' })

  products.filter(match).forEach(update)

  t.deepEqual(products, [
    {
      item: 'chisel',
      sku: 'C001',
      quantity: 4,
      instock: true,
    },
    {
      item: 'hammer',
      sku: 'unknown',
    },
    {
      item: 'nails',
      sku: 'unknown',
    },
  ])
})
