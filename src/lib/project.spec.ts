import test from 'ava'

import { NodeKind } from './node.js'
import { parseProjection } from './project.js'

test('parseProjection', t => {
  t.throws(() => parseProjection(null))
  t.throws(() => parseProjection({}))
  t.throws(() => parseProjection({ a: 0, 'a.b.c': 0 }))
  t.throws(() => parseProjection({ 'a.b.c': 0, a: 0 }))
  t.like(parseProjection({ a: 0, b: 0 }), {
    kind: NodeKind.PROJECT,
    exclusion: true,
    nodes: [
      {
        kind: NodeKind.PATH,
        path: ['a'],
      },
      {
        kind: NodeKind.PATH,
        path: ['b'],
      },
    ],
  })
  t.like(parseProjection({ 'a.b.c': 0, 'a.b.d': 0, 'a.b.e': 0 }), {
    kind: NodeKind.PROJECT,
    exclusion: true,
    nodes: [
      {
        kind: NodeKind.PATH,
        path: ['a', 'b'],
        value: {
          kind: NodeKind.PROJECT,
        },
      },
    ],
  })
  t.throws(() => parseProjection({ a: 0, b: 1 }))
  t.throws(() => parseProjection({ a: true, b: false }))
  t.like(parseProjection({ _id: 0, a: 1, b: 1 }), {
    exclusion: false,
  })
  t.like(parseProjection({ obj: { _id: 0 } }), {
    exclusion: true,
  })
})
