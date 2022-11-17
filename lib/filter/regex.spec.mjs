import test from 'ava'

import { $regex } from './regex.mjs'

test('filter:$regex:RegExp', t => {
  const match = $regex(/^a\\b\/c$/i)
  t.true(match('a\\B/c'))
})

test('filter:$regex:string', t => {
  const match = $regex('^a\\\\b/c$', 'i')
  t.true(match('a\\B/c'))
})
