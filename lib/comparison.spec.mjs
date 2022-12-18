import test from 'ava'

import { lte } from './comparison.mjs'

test('comparison:lte', t => {
  t.true(lte(180, 250))
})
