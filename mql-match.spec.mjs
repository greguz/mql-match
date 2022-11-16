import test from 'ava'

import * as mql from './mql-match.mjs'

test('exports', t => {
  t.true(typeof mql.compileAggregationExpression === 'function')
  t.true(typeof mql.compileAggregationPipeline === 'function')
  t.true(typeof mql.compileFilterQuery === 'function')
  t.true(typeof mql.compileUpdateQuery === 'function')
})
