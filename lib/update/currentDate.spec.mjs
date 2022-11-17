import test from 'ava'

import { compileUpdateQuery } from '../updateQuery.mjs'

test('update:$currentDate', t => {
  const now = new Date()
  const doc = { _id: 1, status: 'a', lastModified: new Date('2013-10-02T01:11:18.965Z') }
  const update = compileUpdateQuery({
    $currentDate: {
      lastModified: true,
      'cancellation.date': { $type: 'date' }
    },
    $set: {
      'cancellation.reason': 'user request',
      status: 'D'
    }
  })
  update(doc)
  t.like(doc, {
    _id: 1,
    status: 'D',
    cancellation: {
      reason: 'user request'
    }
  })
  t.true(doc.lastModified instanceof Date)
  t.true(doc.lastModified >= now)
  t.true(doc.cancellation.date instanceof Date)
  t.true(doc.cancellation.date >= now)
})
