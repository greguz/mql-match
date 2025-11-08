import type { BSONNode, MatchNode } from '../lib/node.js'
import { withParsing } from '../lib/pipeline.js'
import { evalMatch, parseMatch } from '../match.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/
 */
export function* $match(
  docs: Iterable<BSONNode>,
  query: MatchNode,
): Iterable<BSONNode> {
  for (const doc of docs) {
    if (evalMatch(query, doc).value) {
      yield doc
    }
  }
}

withParsing<[MatchNode]>($match, arg => [parseMatch(arg)])
