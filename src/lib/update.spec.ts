import test from 'ava'

import { unwrapBSON, wrapBSON } from './bson.js'
import { nDouble } from './node.js'
import { Path } from './path.js'
import { setPathValue } from './update.js'

test('setPathValue', t => {
  const obj = wrapBSON({ items: [] })

  setPathValue(obj, Path.parseUpdate('items.2.value'), nDouble(42))

  t.deepEqual(unwrapBSON(obj), {
    items: [null, null, { value: 42 }],
  })
})
