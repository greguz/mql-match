import test from 'ava'

import { isTimestamp } from '../bson.mjs'
import { compileUpdateQuery } from '../updateQuery.mjs'
import { isDate } from '../util.mjs'

test('update:$currentDate', t => {
  const doc = { _id: 1, status: 'a', lastModified: new Date('2013-10-02T01:11:18.965Z') }
  const update = compileUpdateQuery({
    $currentDate: {
      lastModified: true,
      'cancellation.date': { $type: 'timestamp' }
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
  t.true(isDate(doc.lastModified))
  t.true(isTimestamp(doc.cancellation.date))
})
