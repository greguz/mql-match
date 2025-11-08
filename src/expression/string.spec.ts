import test from 'ava'

import { wrapBSON } from '../lib/bson.js'
import { $regexMatch } from './string.js'

function match(input: unknown, regex: unknown, options?: unknown) {
  return $regexMatch(wrapBSON(input), wrapBSON(regex), wrapBSON(options)).value
}

test('$regexMatch', t => {
  t.true(match('a\\B/c', /^a\\b\/c$/i))
  t.true(match('a\\B/c', '^a\\\\b/c$', 'i'))
})
