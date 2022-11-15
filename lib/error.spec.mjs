import test from 'ava'

import { MqlError } from './error.mjs'

test('MqlError', t => {
  const err = new MqlError('MQL_TEST', 'Oh no', { more: 'info' })

  t.is(err.code, 'MQL_TEST')
  t.is(err.message, 'Oh no')
  t.deepEqual(err.more, 'info')

  t.is(Object.prototype.toString.call(err), '[object Error]')

  t.is(err.toString(), 'MqlError [MQL_TEST]: Oh no')

  const empty = new MqlError()
  t.is(empty.code, 'MQL_ERROR')
})
