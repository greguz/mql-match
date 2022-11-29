import test from 'ava'

import { compileUpdateQuery } from '../updateQuery.mjs'

test('update:$max:dates', t => {
  const doc = {
    _id: 1,
    desc: 'decorative arts',
    dateEntered: new Date('2013-10-01T05:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16.163Z')
  }
  compileUpdateQuery({ $max: { dateExpired: new Date('2013-09-30') } })(doc)
  t.deepEqual(doc, {
    _id: 1,
    desc: 'decorative arts',
    dateEntered: new Date('2013-10-01T05:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16.163Z')
  })
})

test('update:$max:numbers', t => {
  const doc = { _id: 1, highScore: 800, lowScore: 200 }
  compileUpdateQuery({ $max: { highScore: 950 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })
  compileUpdateQuery({ $max: { highScore: 870 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 950, lowScore: 200 })
})
