import test from 'ava'

import { $regex } from './regex.mjs'

function compile (pattern, flags) {
  // eslint-disable-next-line
  return new Function('value', `return ${$regex('value', pattern, flags)}`)
}

test('$regex:RegExp', t => {
  const match = compile(/^a\\b\/c$/i)
  t.true(match('a\\B/c'))
})

test('$regex:options', t => {
  const match = compile(/^a\\b\/c$/, 'i')
  t.true(match('a\\B/c'))
})

test('$regex:string', t => {
  const match = compile('^a\\\\b/c$', 'i')
  t.true(match('a\\B/c'))
})
