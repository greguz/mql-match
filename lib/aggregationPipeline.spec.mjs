import test from 'ava'
import { ObjectId } from 'bson'

import { compileAggregationPipeline } from './aggregationPipeline.mjs'

async function aggregate (documents, stages) {
  const results = []
  const aggregate = compileAggregationPipeline(stages)
  for await (const document of aggregate(documents)) {
    results.push(document)
  }
  return results
}

test('aggregate:$count', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: 1, subject: 'History', score: 88 },
        { _id: 2, subject: 'History', score: 92 },
        { _id: 3, subject: 'History', score: 97 },
        { _id: 4, subject: 'History', score: 71 },
        { _id: 5, subject: 'History', score: 79 },
        { _id: 6, subject: 'History', score: 83 }
      ],
      [
        {
          $match: {
            score: {
              $gt: 80
            }
          }
        },
        {
          $count: 'passing_scores'
        }
      ]
    ),
    [
      { passing_scores: 4 }
    ]
  )
})

test('aggregate:$match', async t => {
  t.deepEqual(
    await aggregate(
      [
        { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
        { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 },
        { _id: new ObjectId('55f5a192d4bede9ac365b257'), author: 'ahn', score: 60, views: 1000 },
        { _id: new ObjectId('55f5a192d4bede9ac365b258'), author: 'li', score: 55, views: 5000 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b259'), author: 'annT', score: 60, views: 50 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25a'), author: 'li', score: 94, views: 999 },
        { _id: new ObjectId('55f5a1d3d4bede9ac365b25b'), author: 'ty', score: 95, views: 1000 }
      ],
      [{ $match: { author: 'dave' } }]
    ),
    [
      { _id: new ObjectId('512bc95fe835e68f199c8686'), author: 'dave', score: 80, views: 100 },
      { _id: new ObjectId('512bc962e835e68f199c8687'), author: 'dave', score: 85, views: 521 }
    ]
  )
})
