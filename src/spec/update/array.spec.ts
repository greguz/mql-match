import test from 'ava'

import { compileFilterQuery, compileUpdateQuery } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pop/
 */
test('$pop', t => {
  // Remove the First Item of an Array
  {
    const doc = { _id: 1, scores: [8, 9, 10] }

    const update = compileUpdateQuery({ $pop: { scores: -1 } })
    update(doc)

    t.deepEqual(doc, { _id: 1, scores: [9, 10] })
  }

  // Remove the Last Item of an Array
  {
    const doc = { _id: 10, scores: [9, 10] }

    const update = compileUpdateQuery({ $pop: { scores: 1 } })
    update(doc)

    t.deepEqual(doc, { _id: 10, scores: [9] })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
 */
test('$addToSet', t => {
  // Field is Not an Array
  {
    const doc = { _id: 1, colors: 'blue, green, red' }

    const update = compileUpdateQuery({ $addToSet: { colors: 'mauve' } })
    t.throws(() => update(doc))
  }

  // Value to Add is An Array
  {
    const doc = { _id: 1, letters: ['a', 'b'] }

    const update = compileUpdateQuery({ $addToSet: { letters: ['c', 'd'] } })
    update(doc)

    t.deepEqual(doc, { _id: 1, letters: ['a', 'b', ['c', 'd']] })
  }

  // Value to Add is a Document
  {
    const doc = {
      _id: 1,
      item: 'polarizing_filter',
      tags: ['electronics', 'camera'],
    }

    const doUpdate = compileUpdateQuery({ $addToSet: { tags: 'accessories' } })
    doUpdate(doc)

    t.deepEqual(doc, {
      _id: 1,
      item: 'polarizing_filter',
      tags: ['electronics', 'camera', 'accessories'],
    })

    const noUpdate = compileUpdateQuery({ $addToSet: { tags: 'camera' } })
    noUpdate(doc)

    t.deepEqual(doc, {
      _id: 1,
      item: 'polarizing_filter',
      tags: ['electronics', 'camera', 'accessories'],
    })
  }

  // $each Modifier
  {
    const doc = { _id: 2, item: 'cable', tags: ['electronics', 'supplies'] }

    const update = compileUpdateQuery({
      $addToSet: { tags: { $each: ['camera', 'electronics', 'accessories'] } },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 2,
      item: 'cable',
      tags: ['electronics', 'supplies', 'camera', 'accessories'],
    })
  }
})

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
    const update = compileUpdateQuery({ $push: { scores: 89 } })
    update(students[0])

    t.deepEqual(students[0], { _id: 1, scores: [44, 78, 38, 80, 89] })
  }

  // Append a Value to Arrays in Multiple Documents
  {
    const update = compileUpdateQuery({ $push: { scores: 95 } })
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

    const update = compileUpdateQuery({
      $push: { scores: { $each: [90, 92, 85] } },
    })
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

    const update = compileUpdateQuery({
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
test('$each', t => {
  const doc = { _id: 2, item: 'cable', tags: ['electronics', 'supplies'] }

  const update = compileUpdateQuery({
    $addToSet: { tags: { $each: ['camera', 'electronics', 'accessories'] } },
  })
  update(doc)

  t.deepEqual(doc, {
    _id: 2,
    item: 'cable',
    tags: ['electronics', 'supplies', 'camera', 'accessories'],
  })
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/position/
 */
test('$position', t => {
  // Add Elements at the Start of the Array
  {
    const doc = { _id: 1, scores: [100] }

    const update = compileUpdateQuery({
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

    const update = compileUpdateQuery({
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

    const update = compileUpdateQuery({
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
test('$slice', t => {
  // Slice from the End of the Array
  {
    const doc = { _id: 1, scores: [40, 50, 60] }

    const update = compileUpdateQuery({
      $push: {
        scores: {
          $each: [80, 78, 86],
          $slice: -5,
        },
      },
    })
    update(doc)

    t.deepEqual(doc, { _id: 1, scores: [50, 60, 80, 78, 86] })
  }

  // Slice from the Front of the Array
  {
    const doc = { _id: 2, scores: [89, 90] }

    const update = compileUpdateQuery({
      $push: {
        scores: {
          $each: [100, 20],
          $slice: 3,
        },
      },
    })
    update(doc)

    t.deepEqual(doc, { _id: 2, scores: [89, 90, 100] })
  }

  // Update Array Using Slice Only
  {
    const doc = { _id: 3, scores: [89, 70, 100, 20] }

    const update = compileUpdateQuery({
      $push: {
        scores: {
          $each: [],
          $slice: -3,
        },
      },
    })
    update(doc)

    t.deepEqual(doc, { _id: 3, scores: [70, 100, 20] })
  }

  // Use $slice with Other $push Modifiers
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

    const update = compileUpdateQuery({
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
 * https://www.mongodb.com/docs/manual/reference/operator/update/sort/
 */
test('$sort', t => {
  // Sort Array of Documents by a Field in the Documents
  {
    const doc = {
      _id: 1,
      quizzes: [
        { id: 1, score: 6 },
        { id: 2, score: 9 },
      ],
    }

    const update = compileUpdateQuery({
      $push: {
        quizzes: {
          $each: [
            { id: 3, score: 8 },
            { id: 4, score: 7 },
            { id: 5, score: 6 },
          ],
          $sort: { score: 1 },
        },
      },
    })
    update(doc)

    t.deepEqual(doc, {
      _id: 1,
      quizzes: [
        { id: 1, score: 6 },
        { id: 5, score: 6 },
        { id: 4, score: 7 },
        { id: 3, score: 8 },
        { id: 2, score: 9 },
      ],
    })
  }

  // Sort Array Elements That Are Not Documents
  {
    const doc = { _id: 2, tests: [89, 70, 89, 50] }

    const update = compileUpdateQuery({
      $push: { tests: { $each: [40, 60], $sort: 1 } },
    })
    update(doc)

    t.deepEqual(doc, { _id: 2, tests: [40, 50, 60, 70, 89, 89] })
  }

  // Update Array Using Sort Only
  {
    const doc = { _id: 3, tests: [89, 70, 100, 20] }

    const update = compileUpdateQuery({
      $push: { tests: { $each: [], $sort: -1 } },
    })
    update(doc)

    t.deepEqual(doc, { _id: 3, tests: [100, 89, 70, 20] })
  }

  // Use $sort with Other $push Modifiers
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

    const update = compileUpdateQuery({
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
 * https://www.mongodb.com/docs/manual/reference/operator/update/positional/
 */
test('$', t => {
  // TODO: new API?
  const updateOne = (m: unknown, u: unknown) => {
    const match = compileFilterQuery(m)
    const update = compileUpdateQuery(u)

    return (doc: unknown) => {
      if (match(doc)) {
        update(doc)
      }
    }
  }

  const students: unknown[] = [
    { _id: 1, grades: [85, 80, 80] },
    { _id: 2, grades: [88, 90, 92] },
    { _id: 3, grades: [85, 100, 90] },
  ]

  // Update Values in an Array
  {
    const update = updateOne(
      { _id: 1, grades: 80 },
      { $set: { 'grades.$': 82 } },
    )
    students.forEach(update)

    t.deepEqual(students, [
      { _id: 1, grades: [85, 82, 80] },
      { _id: 2, grades: [88, 90, 92] },
      { _id: 3, grades: [85, 100, 90] },
    ])
  }

  // Update Documents in an Array
  {
    students.push({
      _id: 4,
      grades: [
        { grade: 80, mean: 75, std: 8 },
        { grade: 85, mean: 90, std: 5 },
        { grade: 85, mean: 85, std: 8 },
      ],
    })

    const update = updateOne(
      { _id: 4, 'grades.grade': 85 },
      { $set: { 'grades.$.std': 6 } },
    )
    students.forEach(update)

    t.deepEqual(students[3], {
      _id: 4,
      grades: [
        { grade: 80, mean: 75, std: 8 },
        { grade: 85, mean: 90, std: 6 },
        { grade: 85, mean: 85, std: 8 },
      ],
    })
  }

  // Update Embedded Documents Using Multiple Field Matches
  {
    students.push({
      _id: 5,
      grades: [
        { grade: 80, mean: 75, std: 8 },
        { grade: 85, mean: 90, std: 5 },
        { grade: 90, mean: 85, std: 3 },
      ],
    })

    const update = updateOne(
      {
        _id: 5,
        grades: { $elemMatch: { grade: { $lte: 90 }, mean: { $gt: 80 } } },
      },
      { $set: { 'grades.$.std': 6 } },
    )
    students.forEach(update)

    t.deepEqual(students[4], {
      _id: 5,
      grades: [
        { grade: 80, mean: 75, std: 8 },
        { grade: 85, mean: 90, std: 6 },
        { grade: 90, mean: 85, std: 3 },
      ],
    })
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/positional-all/
 */
test('$[]', t => {
  // Behavior
  {
    const doc = { myArray: [5, 8] }

    const update = compileUpdateQuery({ $set: { 'myArray.$[]': 10 } })
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

    const update = compileUpdateQuery({ $inc: { 'grades.$[]': 10 } })
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

    const update = compileUpdateQuery({ $inc: { 'grades.$[].std': -2 } })
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

    const match = compileFilterQuery({ grades: { $ne: 100 } })

    const update = compileUpdateQuery({ $inc: { 'grades.$[]': 10 } })

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

    const update = compileUpdateQuery({
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
