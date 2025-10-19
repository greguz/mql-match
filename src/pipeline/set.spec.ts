import test from 'ava'

import { parseExpression } from '../expression.js'
import { unwrapBSON, wrapBSON } from '../lib/bson.js'
import { $set } from './set.js'

function bind(expr: unknown) {
  const exprNode = parseExpression(wrapBSON(expr))
  return (doc?: unknown) => {
    const results = Array.from($set([wrapBSON(doc)], exprNode))
    if (results.length !== 1) {
      throw new Error('Expected exactly one document')
    }
    return unwrapBSON(results[0])
  }
}

test('Using Two $set Stages', t => {
  const s0 = bind({
    totalHomework: { $sum: '$homework' },
    totalQuiz: { $sum: '$quiz' },
  })
  const s1 = bind({
    totalScore: { $add: ['$totalHomework', '$totalQuiz', '$extraCredit'] },
  })
  const set = (doc: unknown) => s1(s0(doc))

  t.deepEqual(
    set({
      _id: 1,
      student: 'Maya',
      homework: [10, 5, 10],
      quiz: [10, 8],
      extraCredit: 0,
    }),
    {
      _id: 1,
      student: 'Maya',
      homework: [10, 5, 10],
      quiz: [10, 8],
      extraCredit: 0,
      totalHomework: 25,
      totalQuiz: 18,
      totalScore: 43,
    },
  )
  t.deepEqual(
    set({
      _id: 2,
      student: 'Ryan',
      homework: [5, 6, 5],
      quiz: [8, 8],
      extraCredit: 8,
    }),
    {
      _id: 2,
      student: 'Ryan',
      homework: [5, 6, 5],
      quiz: [8, 8],
      extraCredit: 8,
      totalHomework: 16,
      totalQuiz: 16,
      totalScore: 40,
    },
  )
})

test('Adding Fields to an Embedded Document', t => {
  const set = bind({ 'specs.fuel_type': 'unleaded' })

  t.deepEqual(set({ _id: 1, type: 'car', specs: { doors: 4, wheels: 4 } }), {
    _id: 1,
    type: 'car',
    specs: { doors: 4, wheels: 4, fuel_type: 'unleaded' },
  })
  t.deepEqual(
    set({ _id: 2, type: 'motorcycle', specs: { doors: 0, wheels: 2 } }),
    {
      _id: 2,
      type: 'motorcycle',
      specs: { doors: 0, wheels: 2, fuel_type: 'unleaded' },
    },
  )
  t.deepEqual(set({ _id: 3, type: 'jet ski' }), {
    _id: 3,
    type: 'jet ski',
    specs: { fuel_type: 'unleaded' },
  })
})

test('Overwriting an existing field', t => {
  const setCats = bind({ cats: 20 })

  t.deepEqual(setCats({ _id: 1, dogs: 10, cats: 15 }), {
    _id: 1,
    dogs: 10,
    cats: 20,
  })

  const setId = bind({ _id: '$item', item: 'fruit' })

  t.deepEqual(setId({ _id: 1, item: 'tangerine', type: 'citrus' }), {
    _id: 'tangerine',
    item: 'fruit',
    type: 'citrus',
  })
  t.deepEqual(setId({ _id: 2, item: 'lemon', type: 'citrus' }), {
    _id: 'lemon',
    item: 'fruit',
    type: 'citrus',
  })
  t.deepEqual(setId({ _id: 3, item: 'grapefruit', type: 'citrus' }), {
    _id: 'grapefruit',
    item: 'fruit',
    type: 'citrus',
  })
})

test('Add Element to an Array', t => {
  const set = bind({
    homework: {
      $concatArrays: ['$homework', [7]],
    },
  })

  t.deepEqual(
    set({
      _id: 1,
      student: 'Maya',
      homework: [10, 5, 10],
      quiz: [10, 8],
      extraCredit: 0,
    }),
    {
      _id: 1,
      student: 'Maya',
      homework: [10, 5, 10, 7],
      quiz: [10, 8],
      extraCredit: 0,
    },
  )
})

test('Creating a New Field with Existing Fields', t => {
  const set = bind({
    quizAverage: {
      $avg: '$quiz',
    },
  })

  t.deepEqual(
    set({
      _id: 1,
      student: 'Maya',
      homework: [10, 5, 10],
      quiz: [10, 8],
      extraCredit: 0,
    }),
    {
      _id: 1,
      student: 'Maya',
      homework: [10, 5, 10],
      quiz: [10, 8],
      extraCredit: 0,
      quizAverage: 9,
    },
  )
  t.deepEqual(
    set({
      _id: 2,
      student: 'Ryan',
      homework: [5, 6, 5],
      quiz: [8, 8],
      extraCredit: 8,
    }),
    {
      _id: 2,
      student: 'Ryan',
      homework: [5, 6, 5],
      quiz: [8, 8],
      extraCredit: 8,
      quizAverage: 8,
    },
  )
})
