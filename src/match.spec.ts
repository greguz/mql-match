import test from 'ava'

import { compileMatch } from './match.js'

function match(query: unknown, value?: unknown): boolean {
  return compileMatch(query)(value)
}

// function match(data: unknown[], query: unknown) {
//   return data.filter(compileMatch(query))
// }

// test('$elemMatch', t => {
//   t.deepEqual(
//     match(
//       [
//         { _id: 1, results: [82, 85, 88] },
//         { _id: 2, results: [75, 88, 89] },
//       ],
//       {
//         results: {
//           $elemMatch: {
//             $gte: 80,
//             $lt: 85,
//           },
//         },
//       },
//     ),
//     [{ _id: 1, results: [82, 85, 88] }],
//   )
//   const items = [
//     {
//       _id: 1,
//       results: [
//         { product: 'abc', score: 10 },
//         { product: 'xyz', score: 5 },
//       ],
//     },
//     {
//       _id: 2,
//       results: [
//         { product: 'abc', score: 8 },
//         { product: 'xyz', score: 7 },
//       ],
//     },
//     {
//       _id: 3,
//       results: [
//         { product: 'abc', score: 7 },
//         { product: 'xyz', score: 8 },
//       ],
//     },
//     {
//       _id: 4,
//       results: [
//         { product: 'abc', score: 7 },
//         { product: 'def', score: 8 },
//       ],
//     },
//   ]
//   t.deepEqual(
//     match(items, {
//       results: {
//         $elemMatch: {
//           product: 'xyz',
//           score: {
//             $gte: 8,
//           },
//         },
//       },
//     }),
//     [
//       {
//         _id: 3,
//         results: [
//           { product: 'abc', score: 7 },
//           { product: 'xyz', score: 8 },
//         ],
//       },
//     ],
//   )
//   t.deepEqual(
//     match(items, {
//       results: {
//         $elemMatch: {
//           product: {
//             $ne: 'xyz',
//           },
//         },
//       },
//     }),
//     [
//       {
//         _id: 1,
//         results: [
//           { product: 'abc', score: 10 },
//           { product: 'xyz', score: 5 },
//         ],
//       },
//       {
//         _id: 2,
//         results: [
//           { product: 'abc', score: 8 },
//           { product: 'xyz', score: 7 },
//         ],
//       },
//       {
//         _id: 3,
//         results: [
//           { product: 'abc', score: 7 },
//           { product: 'xyz', score: 8 },
//         ],
//       },
//       {
//         _id: 4,
//         results: [
//           { product: 'abc', score: 7 },
//           { product: 'def', score: 8 },
//         ],
//       },
//     ],
//   )
//   t.deepEqual(
//     match(items, {
//       'results.product': {
//         $ne: 'xyz',
//       },
//     }),
//     [
//       {
//         _id: 4,
//         results: [
//           { product: 'abc', score: 7 },
//           { product: 'def', score: 8 },
//         ],
//       },
//     ],
//   )
// })

// test('$eq', t => {
//   const items = [
//     {
//       _id: 1,
//       item: { name: 'ab', code: '123' },
//       qty: 15,
//       tags: ['A', 'B', 'C'],
//     },
//     { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
//     { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
//     { _id: 4, item: { name: 'xy', code: '456' }, qty: 30, tags: ['B', 'A'] },
//     {
//       _id: 5,
//       item: { name: 'mn', code: '000' },
//       qty: 20,
//       tags: [['A', 'B'], 'C'],
//     },
//   ]
//   t.deepEqual(match(items, { 'item.name': { $eq: 'ab' } }), [
//     {
//       _id: 1,
//       item: { name: 'ab', code: '123' },
//       qty: 15,
//       tags: ['A', 'B', 'C'],
//     },
//   ])
//   t.deepEqual(match(items, { qty: { $eq: 20 } }), [
//     { _id: 2, item: { name: 'cd', code: '123' }, qty: 20, tags: ['B'] },
//     {
//       _id: 5,
//       item: { name: 'mn', code: '000' },
//       qty: 20,
//       tags: [['A', 'B'], 'C'],
//     },
//   ])
//   t.deepEqual(
//     match(items, {
//       tags: {
//         $eq: ['A', 'B'],
//       },
//     }),
//     [
//       { _id: 3, item: { name: 'ij', code: '456' }, qty: 25, tags: ['A', 'B'] },
//       {
//         _id: 5,
//         item: { name: 'mn', code: '000' },
//         qty: 20,
//         tags: [['A', 'B'], 'C'],
//       },
//     ],
//   )
// })

// test('$size', t => {
//   t.throws(() => match([], { field: { $size: -1 } }))
//   const items = [
//     { field: ['red', 'green'] },
//     { field: ['apple', 'lime'] },
//     { field: ['fruit'] },
//     { field: ['orange', 'lemon', 'grapefruit'] },
//   ]
//   t.deepEqual(match(items, { field: { $size: 2 } }), [
//     { field: ['red', 'green'] },
//     { field: ['apple', 'lime'] },
//   ])
//   t.deepEqual(match(items, { field: { $size: 1 } }), [{ field: ['fruit'] }])
// })

test('$eq', t => {
  t.true(match({ value: 42 }, { value: 42 }))
  t.true(match({ value: { $eq: 42 } }, { value: 42 }))

  t.true(match({ 'a.b': 42 }, { a: { b: 42 } }))
  t.true(match({ 'a.b': { $eq: 42 } }, { a: { b: 42 } }))

  t.true(
    match(
      { 'items.message': 'hello world' },
      { items: [{ message: 'hello world' }] },
    ),
  )
  t.true(
    match(
      { 'items.message': { $eq: 'hello world' } },
      { items: [{ message: 'hello world' }] },
    ),
  )

  t.true(
    match(
      { obj: { hello: 'world' } },
      {
        obj: {
          hello: 'world',
        },
      },
    ),
  )
  t.true(
    match(
      { obj: { $eq: { hello: 'world' } } },
      {
        obj: {
          hello: 'world',
        },
      },
    ),
  )
  t.false(
    match(
      { obj: { hello: 'world' } },
      {
        obj: {
          hello: 'world',
          oh: 'no',
        },
      },
    ),
  )
})

test('$expr', t => {
  t.true(
    match(
      {
        $expr: true,
        hello: 'world', // manually tested
      },
      {
        hello: 'world',
        pdor: 'kmer',
      },
    ),
  )
  t.false(
    match(
      {
        $expr: false,
        hello: 'world',
      },
      {
        hello: 'world',
        pdor: 'kmer',
      },
    ),
  )
})
