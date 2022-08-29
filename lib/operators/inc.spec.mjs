import test from 'ava'

import { createSubject } from '../subject.mjs'
import { $inc } from './inc.mjs'

function compile (path, value) {
  const variable = 'obj'
  const subject = createSubject(variable, path.split('.'))
  // eslint-disable-next-line
  return new Function(variable, $inc(subject, value) + `; return ${variable};`)
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
