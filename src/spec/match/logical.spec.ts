import test from 'ava'

import { compileFilterQuery } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/and/
 */
test('$and', t => {
  const match = compileFilterQuery({
    $and: [{ price: { $ne: 1.99 } }, { price: { $exists: true } }],
  })

  t.false(match(3)) // funny!
  t.false(match({})) // funny!
  t.false(match({ price: 1.99 }))
  t.true(match({ price: 42 }))
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/nor/
 */
test('$nor', t => {
  const match = compileFilterQuery({ $nor: [{ price: 1.99 }, { sale: true }] })

  t.true(match(3)) // funny!
  t.true(match({})) // funny!
  t.false(match({ price: 1.99 }))
  t.false(match({ sale: true }))
  t.false(match({ price: 1.99, sale: true }))
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/not/
 */
test('$not', t => {
  const match = compileFilterQuery({ price: { $not: { $gt: 1.99 } } })

  t.true(match(3)) // funny!
  t.true(match({})) // funny!
  t.false(match({ price: 69 }))
  t.true(match({ price: 1.99 }))
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/or/
 */
test('$or', t => {
  const match = compileFilterQuery({
    $or: [{ quantity: { $lt: 20 } }, { price: 10 }],
  })

  t.false(match(3)) // funny!
  t.false(match({})) // funny!
  t.false(match({ quantity: 69, price: 1.99 }))
  t.true(match({ quantity: 10, price: 1.99 }))
  t.true(match({ quantity: 69, price: 10 }))
})
