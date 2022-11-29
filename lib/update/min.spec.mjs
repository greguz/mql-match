import test from 'ava'

import { compileUpdateQuery } from '../updateQuery.mjs'

test('update:$min:dates', t => {
  const doc = {
    _id: 1,
    desc: 'crafts',
    dateEntered: new Date('2013-10-01T05:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16Z')
  }
  compileUpdateQuery({ $min: { dateEntered: new Date('2013-09-25') } })(doc)
  t.deepEqual(doc, {
    _id: 1,
    desc: 'crafts',
    dateEntered: new Date('2013-09-25T00:00:00Z'),
    dateExpired: new Date('2013-10-01T16:38:16Z')
  })
})

test('update:$min:numbers', t => {
  const doc = { _id: 1, highScore: 800, lowScore: 200 }
  compileUpdateQuery({ $min: { lowScore: 150 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })
  compileUpdateQuery({ $min: { lowScore: 250 } })(doc)
  t.deepEqual(doc, { _id: 1, highScore: 800, lowScore: 150 })
})
