import { parseBSONType } from '../lib/bson.js'
import { type MatchOperator, withArrayUnwrap } from '../lib/match.js'
import { type BSONNode, NodeKind, nBoolean } from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/type/
 */
export function $exists(arg: BSONNode): MatchOperator {
  if (arg.value === true) {
    return value => {
      return nBoolean(
        value.kind !== NodeKind.NULLISH || value.key === undefined,
      )
    }
  }

  if (arg.value === false) {
    return value => {
      return nBoolean(
        value.kind === NodeKind.NULLISH && value.key !== undefined,
      )
    }
  }

  throw new TypeError(`$exists expects a boolean (got ${arg.kind})`)
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/type/
 */
function $typeStrict(arg: BSONNode): MatchOperator {
  const expectedTypes = Array.from(parseNodeKinds(arg))

  return value => {
    let result = false
    for (let i = 0; i < expectedTypes.length && !result; i++) {
      result = value.kind === expectedTypes[i]
    }
    return nBoolean(result)
  }
}

function* parseNodeKinds(arg: BSONNode): Generator<BSONNode['kind']> {
  if (arg.kind === NodeKind.ARRAY) {
    if (!arg.value.length) {
      throw new TypeError('$type must match with at least one type')
    }
    for (const y of arg.value) {
      yield* parseNodeKind(y)
    }
  } else {
    yield* parseNodeKind(arg)
  }
}

function* parseNodeKind(arg: BSONNode): Generator<BSONNode['kind']> {
  if (arg.kind === NodeKind.STRING && arg.value === 'number') {
    yield NodeKind.DECIMAL
    yield NodeKind.DOUBLE
    yield NodeKind.INT
    yield NodeKind.LONG
  } else {
    yield parseBSONType(arg)
  }
}

export const $type = withArrayUnwrap($typeStrict)
