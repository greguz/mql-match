import test from 'ava'
import { Timestamp } from 'bson'

import { compileUpdate } from '../../exports.js'

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

    const update = compileUpdate({
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

  const update = compileUpdate({ $inc: { quantity: -2, 'metrics.orders': 1 } })
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

    const doUpdate = compileUpdate({ $min: { lowScore: 150 } })
    doUpdate(doc)

    t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })

    const noUpdate = compileUpdate({ $min: { lowScore: 250 } })
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

    const update = compileUpdate({
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

    const doUpdate = compileUpdate({ $max: { highScore: 950 } })
    doUpdate(doc)

    t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })

    const noUpdate = compileUpdate({ $max: { highScore: 870 } })
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

    const update = compileUpdate({
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
test.todo('$mul')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/rename/
 */
test.todo('$rename')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/set/
 */
test.todo('$set')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/setOnInsert/
 */
test.todo('$setOnInsert')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/unset/
 */
test.todo('$unset')
