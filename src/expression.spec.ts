import test from 'ava'
import { ObjectId } from 'bson'

import { compileExpression } from './expression.js'

function exec(exp: unknown, value?: unknown) {
  return compileExpression(exp)(value)
}

test('$type', t => {
  t.throws(() => exec({ $type: null }))
  t.throws(() => exec({ $type: [] }))
  t.throws(() => exec({ $type: [4, 2] }))
  t.is(exec({ $type: [42] }), 'double')
  t.is(exec({ $type: [[]] }), 'array')
  t.is(exec({ $type: ['panic'] }), 'string')
  t.is(exec({ $type: ['$$NOW'] }), 'date')
})

test('$$NOW', t => {
  t.true(exec('$$NOW') instanceof Date)
  const a = exec('$$NOW')
  const b = exec('$$NOW')
  t.is(a === b, false)
})

test('$$ROOT', t => {
  t.is(exec('$$ROOT'), null)
  t.is(exec('$$ROOT', 42), 42)
})

test('$convert', t => {
  t.throws(() => exec({ $convert: 24 }))
  t.is(exec({ $convert: { input: 1.99999, to: 'bool' } }), true)
  t.is(exec({ $convert: { input: 0, to: 'bool' } }), false)
})

test('$toBool', t => {
  t.is(exec({ $toBool: [null] }), null)
  t.is(exec({ $toBool: 0 }), false)
  t.is(exec({ $toBool: -1 }), true)
})

test('$literal', t => {
  t.is(exec({ $literal: '$$NOW' }), '$$NOW')
})

test('$isNumber', t => {
  t.is(exec({ $isNumber: 0 }), true)
  t.is(exec({ $isNumber: 1n }), true)
  t.is(exec({ $isNumber: Number.NaN }), true)
  t.is(exec({ $isNumber: [null] }), false)
})

test('$toObjectId', t => {
  const hex = '424242424242424242424242'

  const a = exec({ $toObjectId: hex })
  t.true(a instanceof ObjectId && a.toHexString() === hex)

  const b = exec({ $toObjectId: a })
  t.true(b instanceof ObjectId && a === b)
})

test('$toString', t => {
  const date = new Date()
  t.is(exec({ $toString: date }), date.toISOString())
  t.is(exec({ $toString: false }), 'false')
  t.is(exec({ $toString: true }), 'true')
  t.is(exec({ $toString: 4.2 }), '4.2')
})

test('$toDouble', t => {
  t.is(exec({ $toDouble: true }), 1)
  t.is(exec({ $toDouble: false }), 0)
  t.is(exec({ $toDouble: 2.5 }), 2.5)
  t.is(exec({ $toDouble: '-5.5' }), -5.5)
  t.is(exec({ $toDouble: new Date('2018-03-27T05:04:47.890Z') }), 1522127087890)
})

test('$', t => {
  t.is(exec('$v', { v: 4 }), 4)
  t.is(exec('$a.b', { a: { b: 2 } }), 2)
})

test('project', t => {
  t.deepEqual(
    exec(
      {
        'author.first': 0,
        lastModified: 0,
      },
      {
        _id: 1,
        title: 'abc123',
        isbn: '0001122223334',
        author: { last: 'zzz', first: 'aaa' },
        copies: 5,
        lastModified: '2016-07-28',
      },
    ),
    {
      _id: 1,
      title: 'abc123',
      isbn: '0001122223334',
      author: {
        last: 'zzz',
      },
      copies: 5,
    },
  )
  t.deepEqual(
    exec(
      {
        author: { first: 0 },
        lastModified: 0,
      },
      {
        _id: 1,
        title: 'abc123',
        isbn: '0001122223334',
        author: { last: 'zzz', first: 'aaa' },
        copies: 5,
        lastModified: '2016-07-28',
      },
    ),
    {
      _id: 1,
      title: 'abc123',
      isbn: '0001122223334',
      author: {
        last: 'zzz',
      },
      copies: 5,
    },
  )
  t.deepEqual(
    exec(
      {
        'a.b': 1,
        'c.d.e': 1,
      },
      {
        _id: 'my_document',
        a: {
          b: 4,
          x: 2,
        },
        c: {
          d: [
            null,
            {
              e: true,
              x: false,
            },
          ],
        },
      },
    ),
    {
      _id: 'my_document',
      a: {
        b: 4,
      },
      c: {
        d: [
          null,
          {
            e: true,
          },
        ],
      },
    },
  )
  t.deepEqual(
    exec(
      {
        'a.b': 0,
        'c.d.e': 0,
      },
      {
        _id: 'my_document',
        a: {
          b: 4,
          x: 2,
        },
        c: {
          d: [
            null,
            {
              e: true,
              x: false,
            },
          ],
        },
      },
    ),
    {
      _id: 'my_document',
      a: {
        x: 2,
      },
      c: {
        d: [
          null,
          {
            x: false,
          },
        ],
      },
    },
  )
})

test('expressions:array', t => {
  t.deepEqual(
    exec(
      { a: ['$value', 2, { $multiply: [7, 3] }] },
      { _id: 'my_doc', value: 4 },
    ),
    { _id: 'my_doc', a: [4, 2, 21] },
  )
})

test('smoke', t => {
  t.deepEqual(
    exec(
      {
        a: {
          b: { value: '$left' },
          c: { value: '$right' },
        },
      },
      { left: 4, right: 2 },
    ),
    {
      _id: null,
      a: {
        b: { value: 4 },
        c: { value: 2 },
      },
    },
  )
})
