import { unwrapNumber } from '../lib/bson.js'
import { type BSONNode, type DoubleNode, nDouble } from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'

export function* $skip(
  docs: Iterable<BSONNode>,
  skip: DoubleNode,
): Iterable<BSONNode> {
  let n = skip.value
  for (const doc of docs) {
    if (n > 0) {
      n--
    } else {
      yield doc
    }
  }
}

withStageParsing($skip, arg => {
  const message = 'Stage $skip expects a positive integer or zero'
  const n = unwrapNumber(arg, message)
  if (!Number.isInteger(n) || n < 0) {
    throw new TypeError(message)
  }
  return [nDouble(n)] as const
})
