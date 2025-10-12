import test from 'ava'

import { compileUpdate } from './update.js'

function update(data: unknown, query: unknown, insert = false) {
  const fn = compileUpdate(query)
  if (Array.isArray(data)) {
    return data.map(item => fn(item, insert))
  }
  return fn(data, insert)
}

test('$inc', t => {
  t.deepEqual(update({}, { $inc: { value: 1 } }), { value: 1 })
  t.deepEqual(update({ value: 20 }, { $inc: { value: 22 } }), { value: 42 })
})

test('$pop', t => {
  t.deepEqual(
    update({ _id: 1, scores: [8, 9, 10] }, { $pop: { scores: -1 } }),
    { _id: 1, scores: [9, 10] },
  )
  t.deepEqual(update({ _id: 10, scores: [9, 10] }, { $pop: { scores: 1 } }), {
    _id: 10,
    scores: [9],
  })
})

test('$pull', t => {
  t.deepEqual(
    update(
      [
        {
          _id: 1,
          fruits: ['apples', 'pears', 'oranges', 'grapes', 'bananas'],
          vegetables: ['carrots', 'celery', 'squash', 'carrots'],
        },
        {
          _id: 2,
          fruits: ['plums', 'kiwis', 'oranges', 'bananas', 'apples'],
          vegetables: ['broccoli', 'zucchini', 'carrots', 'onions'],
        },
      ],
      {
        $pull: {
          fruits: {
            $in: ['apples', 'oranges'],
          },
          vegetables: 'carrots',
        },
      },
    ),
    [
      {
        _id: 1,
        fruits: ['pears', 'grapes', 'bananas'],
        vegetables: ['celery', 'squash'],
      },
      {
        _id: 2,
        fruits: ['plums', 'kiwis', 'bananas'],
        vegetables: ['broccoli', 'zucchini', 'onions'],
      },
    ],
  )
})

test('$push', t => {
  t.deepEqual(
    update({ _id: 1, scores: [44, 78, 38, 80] }, { $push: { scores: 89 } }),
    { _id: 1, scores: [44, 78, 38, 80, 89] },
  )
  t.deepEqual(
    update(
      { _id: 1, name: 'joe', scores: [42] },
      { $push: { scores: { $each: [90, 92, 85] } } },
    ),
    { _id: 1, name: 'joe', scores: [42, 90, 92, 85] },
  )
  t.deepEqual(
    update(
      { _id: 1, scores: [100] },
      {
        $push: {
          scores: {
            $each: [50, 60, 70],
            $position: 0,
          },
        },
      },
    ),
    { _id: 1, scores: [50, 60, 70, 100] },
  )
  t.deepEqual(
    update(
      { _id: 2, scores: [50, 60, 70, 100] },
      {
        $push: {
          scores: {
            $each: [20, 30],
            $position: 2,
          },
        },
      },
    ),
    { _id: 2, scores: [50, 60, 20, 30, 70, 100] },
  )
  t.deepEqual(
    update(
      { _id: 3, scores: [50, 60, 20, 30, 70, 100] },
      {
        $push: {
          scores: {
            $each: [90, 80],
            $position: -2,
          },
        },
      },
    ),
    { _id: 3, scores: [50, 60, 20, 30, 90, 80, 70, 100] },
  )
  t.deepEqual(
    update(
      {
        _id: 5,
        quizzes: [
          { wk: 1, score: 10 },
          { wk: 2, score: 8 },
          { wk: 3, score: 5 },
          { wk: 4, score: 6 },
        ],
      },
      {
        $push: {
          quizzes: {
            $each: [
              { wk: 5, score: 8 },
              { wk: 6, score: 7 },
              { wk: 7, score: 6 },
            ],
            $sort: { score: -1 },
            $slice: 3,
          },
        },
      },
    ),
    {
      _id: 5,
      quizzes: [
        { wk: 1, score: 10 },
        { wk: 2, score: 8 },
        { wk: 5, score: 8 },
      ],
    },
  )
})

test('$rename', t => {
  t.deepEqual(
    update(
      {
        _id: 1,
        alias: ['The American Cincinnatus', 'The American Fabius'],
        mobile: '555-555-5555',
        nmae: { first: 'george', last: 'washington' },
      },
      {
        $rename: {
          nmae: 'name',
        },
      },
    ),
    {
      _id: 1,
      alias: ['The American Cincinnatus', 'The American Fabius'],
      mobile: '555-555-5555',
      name: { first: 'george', last: 'washington' },
    },
  )
})

test('$set', t => {
  const obj = {
    _id: 100,
    quantity: 250,
    instock: true,
    reorder: false,
    details: { model: '14QQ', make: 'Clothes Corp' },
    tags: ['apparel', 'clothing'],
    ratings: [{ by: 'Customer007', rating: 4 }],
  }
  t.deepEqual(
    update(obj, {
      $set: {
        quantity: 500,
        details: { model: '2600', make: 'Fashionaires' },
        tags: ['coats', 'outerwear', 'clothing'],
      },
    }),
    {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: '2600', make: 'Fashionaires' },
      tags: ['coats', 'outerwear', 'clothing'],
      ratings: [{ by: 'Customer007', rating: 4 }],
    },
  )
  t.deepEqual(
    update(obj, {
      $set: {
        'details.make': 'Kustom Kidz',
      },
    }),
    {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: '2600', make: 'Kustom Kidz' },
      tags: ['coats', 'outerwear', 'clothing'],
      ratings: [{ by: 'Customer007', rating: 4 }],
    },
  )
  t.deepEqual(
    update(obj, {
      $set: {
        'tags.1': 'rain gear',
        'ratings.0.rating': 2,
      },
    }),
    {
      _id: 100,
      quantity: 500,
      instock: true,
      reorder: false,
      details: { model: '2600', make: 'Kustom Kidz' },
      tags: ['coats', 'rain gear', 'clothing'],
      ratings: [{ by: 'Customer007', rating: 2 }],
    },
  )
})

test('$mul', t => {
  t.deepEqual(
    update(
      { _id: 1, item: 'Hats', price: 10.99, quantity: 25 },
      {
        $mul: {
          price: 1.25,
          quantity: 2,
        },
      },
    ),
    { _id: 1, item: 'Hats', price: 13.7375, quantity: 50 },
  )
  t.deepEqual(update({ _id: 2, item: 'Unknown' }, { $mul: { price: 100 } }), {
    _id: 2,
    item: 'Unknown',
    price: 0,
  })
})

test('$delete', t => {
  t.deepEqual(
    update(
      { item: 'hammer', sku: 'unknown', quantity: 3, instock: true },
      { $unset: { quantity: '', instock: '' } },
    ),
    { item: 'hammer', sku: 'unknown' },
  )
})

test('$max:dates', t => {
  const doc = {
    _id: 1,
    desc: 'decorative arts',
    dateEntered: new Date('2013-10-01T05:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16Z'),
  }
  compileUpdate({ $max: { dateExpired: new Date('2013-09-30') } })(doc)
  t.deepEqual(doc, {
    _id: 1,
    desc: 'decorative arts',
    dateEntered: new Date('2013-10-01T05:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16Z'),
  })
})

test('$max:numbers', t => {
  const doc = { _id: 1, highScore: 800, lowScore: 200 }
  compileUpdate({ $max: { highScore: 950 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })
  compileUpdate({ $max: { highScore: 870 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })
})

test('$min:dates', t => {
  const doc = {
    _id: 1,
    desc: 'crafts',
    dateEntered: new Date('2013-10-01T05:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16Z'),
  }
  compileUpdate({ $min: { dateEntered: new Date('2013-09-25') } })(doc)
  t.deepEqual(doc, {
    _id: 1,
    desc: 'crafts',
    dateEntered: new Date('2013-09-25T00:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16Z'),
  })
})

test('$min:numbers', t => {
  const doc = { _id: 1, highScore: 800, lowScore: 200 }
  compileUpdate({ $min: { lowScore: 150 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })
  compileUpdate({ $min: { lowScore: 250 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })
})

test('$currentDate', t => {
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
    cancellation: {
      reason: 'user request',
    },
  })
  t.true(doc.lastModified instanceof Date)
  // t.true(isTimestamp(doc.cancellation.date))
})

test('$pullAll', t => {
  const doc = { _id: 1, scores: [0, 2, 5, 5, 1, 0] }
  const update = compileUpdate({ $pullAll: { scores: [0, 5] } })
  update(doc)
  t.deepEqual(doc, { _id: 1, scores: [2, 1] })
})
