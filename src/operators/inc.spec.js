import test from 'ava'

import { $inc } from './inc.js'

function compile (path, value) {
  return new Function('obj', $inc(`obj.${path}`, value) + `; return obj;`)
}

test('$inc:undefined', t => {
  const fn = compile('a.b.c', 10)

  t.deepEqual(
    fn({ a: { b: {} } }),
    { a: { b: { c: 10 } } }
  )
})

test('$inc:null', t => {
  const fn = compile('a.b.c', 10)

  t.throws(() => t.deepEqual(
    fn({ a: { b: { c: null } } }),
    { a: { b: { c: 10 } } }
  ))
})

test('$inc:number', t => {
  const fn = compile('a.b.c', 10)

  t.deepEqual(
    fn({ a: { b: { c: 32 } } }),
    { a: { b: { c: 42 } } }
  )
})
