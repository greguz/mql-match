import type { BSONNode, MatchNode } from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'
import { parseMatch, resolveMatch } from '../match.js'

export function* $match(
  docs: Iterable<BSONNode>,
  query: MatchNode,
): Iterable<BSONNode> {
  for (const doc of docs) {
    if (resolveMatch(query, doc).value) {
      yield doc
    }
  }
}

withStageParsing<[MatchNode]>($match, arg => [parseMatch(arg)])
