import test from 'ava'

import { _compile } from '../code.mjs'
import { $regex } from './regex.mjs'

function compile (pattern, flags) {
  return _compile({ arguments: ['value'], body: `return ${$regex('value', pattern, flags)}` })
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
