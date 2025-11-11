import test from 'ava'

import { compileMatch, compileUpdate } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pop/
 */
test('$pop', t => {
  // Remove the First Item of an Array
  {
    const doc = { _id: 1, scores: [8, 9, 10] }

    const update = compileUpdate({ $pop: { scores: -1 } })
    update(doc)

    t.deepEqual(doc, { _id: 1, scores: [9, 10] })
  }

  // Remove the Last Item of an Array
  {
    const doc = { _id: 10, scores: [9, 10] }

    const update = compileUpdate({ $pop: { scores: 1 } })
    update(doc)

    t.deepEqual(doc, { _id: 10, scores: [9] })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
 */
test.todo('$addToSet')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pull/
 */
test.todo('$pull')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/push/
 */
test('$push', t => {
  const students = [
    { _id: 1, scores: [44, 78, 38, 80] },
    { _id: 2, scores: [45, 78, 38, 80, 89] },
    { _id: 3, scores: [46, 78, 38, 80, 89] },
    { _id: 4, scores: [47, 78, 38, 80, 89] },
  ]

  // Append a Value to an Array
  {
    const update = compileUpdate({ $push: { scores: 89 } })
    update(students[0])

    t.deepEqual(students[0], { _id: 1, scores: [44, 78, 38, 80, 89] })
  }

  // Append a Value to Arrays in Multiple Documents
  {
    const update = compileUpdate({ $push: { scores: 95 } })
    students.forEach(update)

    t.deepEqual(students, [
      { _id: 1, scores: [44, 78, 38, 80, 89, 95] },
      { _id: 2, scores: [45, 78, 38, 80, 89, 95] },
      { _id: 3, scores: [46, 78, 38, 80, 89, 95] },
      { _id: 4, scores: [47, 78, 38, 80, 89, 95] },
    ])
  }

  // Append Multiple Values to an Array
  {
    const doc = { name: 'joe', scores: [42] }

    const update = compileUpdate({ $push: { scores: { $each: [90, 92, 85] } } })
    update(doc)

    t.deepEqual(doc, {
      name: 'joe',
      scores: [42, 90, 92, 85],
    })
  }

  // Use $push Operator with Multiple Modifiers
  {
    const doc = {
      _id: 5,
      quizzes: [
        { wk: 1, score: 10 },
        { wk: 2, score: 8 },
        { wk: 3, score: 5 },
        { wk: 4, score: 6 },
      ],
    }

    const update = compileUpdate({
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
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 5,
      quizzes: [
        { wk: 1, score: 10 },
        { wk: 2, score: 8 },
        { wk: 5, score: 8 },
      ],
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/
 */
test.todo('$pullAll')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/each/
 */
test.todo('$each')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/position/
 */
test('$position', t => {
  // Add Elements at the Start of the Array
  {
    const doc = { _id: 1, scores: [100] }

    const update = compileUpdate({
      $push: {
        scores: {
          $each: [50, 60, 70],
          $position: 0,
        },
      },
    })
    update(doc)

    t.deepEqual(doc, { _id: 1, scores: [50, 60, 70, 100] })
  }

  // Add Elements to the Middle of the Array
  {
    const doc = { _id: 2, scores: [50, 60, 70, 100] }

    const update = compileUpdate({
      $push: {
        scores: {
          $each: [20, 30],
          $position: 2,
        },
      },
    })
    update(doc)

    t.deepEqual(doc, { _id: 2, scores: [50, 60, 20, 30, 70, 100] })
  }

  // Use a Negative Array Index (Position) to Add Elements to the Array
  {
    const doc = { _id: 3, scores: [50, 60, 20, 30, 70, 100] }

    const update = compileUpdate({
      $push: {
        scores: {
          $each: [90, 80],
          $position: -2,
        },
      },
    })
    update(doc)

    t.deepEqual(doc, { _id: 3, scores: [50, 60, 20, 30, 90, 80, 70, 100] })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/slice/
 */
test.todo('$slice')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/sort/
 */
test.todo('$sort')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/positional/
 */
test.todo('$')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/positional-all/
 */
test('$[]', t => {
  // Behavior
  {
    const doc = { myArray: [5, 8] }

    const update = compileUpdate({ $set: { 'myArray.$[]': 10 } })
    update(doc)

    t.deepEqual(doc, { myArray: [10, 10] })
  }

  // Nested Arrays
  {
    const students = [
      { _id: 1, grades: [85, 82, 80] },
      { _id: 2, grades: [88, 90, 92] },
      { _id: 3, grades: [85, 100, 90] },
    ]

    const update = compileUpdate({ $inc: { 'grades.$[]': 10 } })
    students.forEach(update)

    t.deepEqual(students, [
      { _id: 1, grades: [95, 92, 90] },
      { _id: 2, grades: [98, 100, 102] },
      { _id: 3, grades: [95, 110, 100] },
    ])
  }

  // Update All Documents in an Array
  {
    const students = [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 8 },
          { grade: 85, mean: 90, std: 6 },
          { grade: 85, mean: 85, std: 8 },
        ],
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 75, std: 8 },
          { grade: 87, mean: 90, std: 5 },
          { grade: 85, mean: 85, std: 6 },
        ],
      },
    ]

    const update = compileUpdate({ $inc: { 'grades.$[].std': -2 } })
    students.forEach(update)

    t.deepEqual(students, [
      {
        _id: 1,
        grades: [
          { grade: 80, mean: 75, std: 6 },
          { grade: 85, mean: 90, std: 4 },
          { grade: 85, mean: 85, std: 6 },
        ],
      },
      {
        _id: 2,
        grades: [
          { grade: 90, mean: 75, std: 6 },
          { grade: 87, mean: 90, std: 3 },
          { grade: 85, mean: 85, std: 4 },
        ],
      },
    ])
  }

  // Update Arrays Specified Using a Negation Query Operator
  {
    const results = [
      { _id: 1, grades: [85, 82, 80] },
      { _id: 2, grades: [88, 90, 92] },
      { _id: 3, grades: [85, 100, 90] },
    ]

    const match = compileMatch({ grades: { $ne: 100 } })

    const update = compileUpdate({ $inc: { 'grades.$[]': 10 } })

    for (const doc of results) {
      if (match(doc)) {
        update(doc)
      }
    }

    t.deepEqual(results, [
      { _id: 1, grades: [95, 92, 90] },
      { _id: 2, grades: [98, 100, 102] },
      { _id: 3, grades: [85, 100, 90] },
    ])
  }

  // Update Nested Arrays in Conjunction with $[<identifier>]
  {
    const doc = {
      _id: 1,
      grades: [
        { type: 'quiz', questions: [10, 8, 5] },
        { type: 'quiz', questions: [8, 9, 6] },
        { type: 'hw', questions: [5, 4, 3] },
        { type: 'exam', questions: [25, 10, 23, 0] },
      ],
    }

    const update = compileUpdate({
      $inc: { 'grades.$[].questions.$[score]': 2 },
    })
    update(doc)

    // TODO: const x = { arrayFilters: [{ score: { $gte: 8 } }] }

    t.deepEqual(doc, {
      _id: 1,
      grades: [
        { type: 'quiz', questions: [12, 10, 5] },
        { type: 'quiz', questions: [10, 11, 6] },
        { type: 'hw', questions: [5, 4, 3] },
        { type: 'exam', questions: [27, 12, 25, 0] },
      ],
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/
 */
test.todo('$[<identifier>]')
