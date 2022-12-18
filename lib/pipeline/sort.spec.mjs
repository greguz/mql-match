import test from 'ava'

import { compileAggregationPipeline } from '../aggregationPipeline.mjs'
import { toArray } from '../util.mjs'

test('aggregate:$sort', async t => {
  const documents = [
    { _id: 1, name: 'Central Park Cafe', borough: 'Manhattan' },
    { _id: 2, name: 'Rock A Feller Bar and Grill', borough: 'Queens' },
    { _id: 3, name: 'Empire State Pub', borough: 'Brooklyn' },
    { _id: 4, name: "Stan's Pizzaria", borough: 'Manhattan' },
    { _id: 5, name: "Jane's Deli", borough: 'Brooklyn' }
  ]

  const aggregate = compileAggregationPipeline([
    {
      $sort: {
        borough: 1
      }
    }
  ])

  t.deepEqual(
    await toArray(aggregate(documents)),
    [
      { _id: 3, name: 'Empire State Pub', borough: 'Brooklyn' },
      { _id: 5, name: "Jane's Deli", borough: 'Brooklyn' },
      { _id: 1, name: 'Central Park Cafe', borough: 'Manhattan' },
      { _id: 4, name: "Stan's Pizzaria", borough: 'Manhattan' },
      { _id: 2, name: 'Rock A Feller Bar and Grill', borough: 'Queens' }
    ]
  )
})
