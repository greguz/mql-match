import test from 'ava'

import { compileFilterQuery } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/regex/
 */
test('$regex', t => {
  const products = [
    { _id: 100, sku: 'abc123', description: 'Single line description.' },
    { _id: 101, sku: 'abc789', description: 'First line\nSecond line' },
    { _id: 102, sku: 'xyz456', description: 'Many spaces before     line' },
    { _id: 103, sku: 'xyz789', description: 'Multiple\nline description' },
    { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
  ]

  // Perform a LIKE Match
  {
    const match = compileFilterQuery({ sku: { $regex: /789$/ } })

    t.deepEqual(products.filter(match), [
      { _id: 101, sku: 'abc789', description: 'First line\nSecond line' },
      { _id: 103, sku: 'xyz789', description: 'Multiple\nline description' },
      { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
    ])
  }

  // Perform Case-Insensitive Regular Expression Match
  {
    const match = compileFilterQuery({ sku: { $regex: /^ABC/i } })

    t.deepEqual(products.filter(match), [
      { _id: 100, sku: 'abc123', description: 'Single line description.' },
      { _id: 101, sku: 'abc789', description: 'First line\nSecond line' },
      { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
    ])
  }

  // Multiline Match for Lines Starting with Specified Pattern #1
  {
    const match = compileFilterQuery({
      description: { $regex: /^S/, $options: 'm' },
    })

    t.deepEqual(products.filter(match), [
      { _id: 100, sku: 'abc123', description: 'Single line description.' },
      { _id: 101, sku: 'abc789', description: 'First line\nSecond line' },
      { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
    ])
  }

  // Multiline Match for Lines Starting with Specified Pattern #2
  {
    const match = compileFilterQuery({ description: { $regex: /^S/ } })

    t.deepEqual(products.filter(match), [
      { _id: 100, sku: 'abc123', description: 'Single line description.' },
      { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
    ])
  }

  // Multiline Match for Lines Starting with Specified Pattern #3
  {
    const match = compileFilterQuery({ description: { $regex: /S/ } })

    t.deepEqual(products.filter(match), [
      { _id: 100, sku: 'abc123', description: 'Single line description.' },
      { _id: 101, sku: 'abc789', description: 'First line\nSecond line' },
      { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
    ])
  }

  // Use the . Dot Character to Match New Line #1
  {
    const match = compileFilterQuery({
      description: { $regex: /m.*line/, $options: 'si' },
    })

    t.deepEqual(products.filter(match), [
      { _id: 102, sku: 'xyz456', description: 'Many spaces before     line' },
      { _id: 103, sku: 'xyz789', description: 'Multiple\nline description' },
    ])
  }

  // Use the . Dot Character to Match New Line #2
  {
    const match = compileFilterQuery({
      description: { $regex: /m.*line/, $options: 'i' },
    })

    t.deepEqual(products.filter(match), [
      { _id: 102, sku: 'xyz456', description: 'Many spaces before     line' },
    ])
  }

  // TODO: Ignore White Spaces in Pattern
  // {
  //   const match = compileMatch({
  //     sku: { $regex: 'abc #category code\n123 #item number', $options: 'x' },
  //   })

  //   t.deepEqual(products.filter(match), [
  //     { _id: 100, sku: 'abc123', description: 'Single line description.' },
  //   ])
  // }

  // TODO: Use a Regular Expression to Match Case in Strings
  // {
  //   const match = compileMatch({ sku: { $regex: '(?i)a(?-i)bc' } })

  //   t.deepEqual(products.filter(match), [
  //     { _id: 100, sku: 'abc123', description: 'Single line description.' },
  //     { _id: 101, sku: 'abc789', description: 'First line\nSecond line' },
  //     { _id: 104, sku: 'Abc789', description: 'SKU starts with A' },
  //   ])
  // }
})
