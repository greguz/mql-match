import test from 'ava'

import { $regex } from './regex.mjs'

test('$regex:RegExp', t => {
  const match = $regex(/^a\\b\/c$/i)
  t.true(match('a\\B/c'))
})

test('$regex:string', t => {
  const match = $regex('^a\\\\b/c$', 'i')
  t.true(match('a\\B/c'))
})
