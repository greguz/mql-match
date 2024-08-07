import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('$rand', async t => {
  t.plan(6)

  const documents = [
    { donorId: 1000, amount: 0, frequency: 1 },
    { donorId: 1001, amount: 0, frequency: 2 },
    { donorId: 1002, amount: 0, frequency: 1 },
    { donorId: 1003, amount: 0, frequency: 2 },
    { donorId: 1004, amount: 0, frequency: 1 }
  ]

  const aggregate = compileAggregationPipeline([
    { $set: { amount: { $multiply: [{ $rand: {} }, 100] } } },
    { $set: { amount: { $floor: '$amount' } } }
  ])

  const out = await toArray(aggregate(documents))
  t.like(
    out,
    [
      { donorId: 1000 },
      { donorId: 1001 },
      { donorId: 1002 },
      { donorId: 1003 },
      { donorId: 1004 }
    ]
  )
  for (const obj of out) {
    t.true(Number.isInteger(obj.amount) && obj.amount >= 0 && obj.amount < 100)
  }
})
