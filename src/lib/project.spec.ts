import test from 'ava'

import { wrapBSON } from './bson.js'
import { NodeKind, type ObjectNode } from './node.js'
import { parseProjection } from './project.js'

function parse(obj: Record<string, unknown>) {
  return parseProjection(wrapBSON(obj) as ObjectNode)
}

test('parseProjection', t => {
  t.throws(() => parse({}))
  t.throws(() => parse({ a: 0, 'a.b.c': 0 }))
  t.throws(() => parse({ 'a.b.c': 0, a: 0 }))
  t.like(parse({ a: 0, b: 0 }), {
    kind: NodeKind.PROJECT,
    exclusion: true,
    nodes: [
      {
        kind: NodeKind.PROJECT_PATH,
        path: ['a'],
      },
      {
        kind: NodeKind.PROJECT_PATH,
        path: ['b'],
      },
    ],
  })
  t.like(parse({ 'a.b.c': 0, 'a.b.d': 0, 'a.b.e': 0 }), {
    kind: NodeKind.PROJECT,
    exclusion: true,
    nodes: [
      {
        kind: NodeKind.PROJECT_PATH,
        path: ['a', 'b'],
        value: {
          kind: NodeKind.PROJECT,
        },
      },
    ],
  })
  t.throws(() => parse({ a: 0, b: 1 }))
  t.throws(() => parse({ a: true, b: false }))
  t.like(parse({ _id: 0, a: 1, b: 1 }), {
    exclusion: false,
  })
  t.like(parse({ obj: { _id: 0 } }), {
    exclusion: true,
  })
})
