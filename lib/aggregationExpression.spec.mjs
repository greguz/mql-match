import test from 'ava'

import { compileAggregationExpression } from './aggregationExpression.mjs'

function project (data, expression) {
  return compileAggregationExpression(expression)(data)
}

test('project', t => {
  t.deepEqual(
    project(
      {
        _id: 1,
        title: 'abc123',
        isbn: '0001122223334',
        author: { last: 'zzz', first: 'aaa' },
        copies: 5,
        lastModified: '2016-07-28'
      },
      {
        'author.first': 0,
        lastModified: 0
      }
    ),
    {
      _id: 1,
      title: 'abc123',
      isbn: '0001122223334',
      author: {
        last: 'zzz'
      },
      copies: 5
    }
  )
  t.deepEqual(
    project(
      {
        _id: 1,
        title: 'abc123',
        isbn: '0001122223334',
        author: { last: 'zzz', first: 'aaa' },
        copies: 5,
        lastModified: '2016-07-28'
      },
      {
        author: { first: 0 },
        lastModified: 0
      }
    ),
    {
      _id: 1,
      title: 'abc123',
      isbn: '0001122223334',
      author: {
        last: 'zzz'
      },
      copies: 5
    }
  )
  t.deepEqual(
    project(
      {
        _id: 'my_document',
        a: {
          b: 4,
          x: 2
        },
        c: {
          d: [
            null,
            {
              e: true,
              x: false
            }
          ]
        }
      },
      {
        'a.b': 1,
        'c.d.e': 1
      }
    ),
    {
      _id: 'my_document',
      a: {
        b: 4
      },
      c: {
        d: [
          null,
          {
            e: true
          }
        ]
      }
    }
  )
  t.deepEqual(
    project(
      {
        _id: 'my_document',
        a: {
          b: 4,
          x: 2
        },
        c: {
          d: [
            null,
            {
              e: true,
              x: false
            }
          ]
        }
      },
      {
        'a.b': 0,
        'c.d.e': 0
      }
    ),
    {
      _id: 'my_document',
      a: {
        x: 2
      },
      c: {
        d: [
          null,
          {
            x: false
          }
        ]
      }
    }
  )
})

test('project:$literal', t => {
  t.deepEqual(
    project(
      { _id: 1, item: 'abc123', condition: 'new' },
      { item: 1, startAt: { $literal: 1 } }
    ),
    { _id: 1, item: 'abc123', startAt: 1 }
  )
})
