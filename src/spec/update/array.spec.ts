import test from 'ava'

import { compileUpdate } from '../../exports.js'

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
test.todo('$push')

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
test.todo('$position')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/slice/
 */
test.todo('$slice')

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/sort/
 */
test.todo('$sort')
