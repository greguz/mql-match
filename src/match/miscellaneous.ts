import { Decimal } from 'decimal.js'

import {
  assertBSON,
  isBSONNumber,
  unwrapDecimal,
  unwrapNumber,
  unwrapRegex,
} from '../lib/bson.js'
import { withArrayUnwrap, withParsing } from '../lib/match.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nNullish,
  type RegexNode,
} from '../lib/node.js'
import { expected } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/mod/
 *
 * Also, starting in MongoDB 5.1 (and 5.0.4), $mod returns an error if the divisor or remainder values evaluate to:
 * - NaN (not a number).
 * - Infinity.
 * - A value that can't be represented using a 64-bit integer.
 */
export function $mod(
  dividendNode: BSONNode,
  divisorNode: BSONNode,
  remainderNode: BSONNode,
): BooleanNode {
  if (!isBSONNumber(dividendNode)) {
    return nBoolean(false)
  }
  return nBoolean(
    Decimal.mod(unwrapNumber(dividendNode), unwrapNumber(divisorNode)).equals(
      unwrapNumber(remainderNode),
    ),
  )
}

withParsing($mod, arg => {
  if (arg.kind !== NodeKind.ARRAY) {
    throw new TypeError('malformed mod, needs to be an array')
  }
  if (arg.value.length !== 2) {
    throw new TypeError('malformed mod, not enough elements')
  }

  const divisor = unwrapDecimal(
    arg.value[0],
    'malformed mod, divisor not a number',
  )

  const remainder = unwrapDecimal(
    arg.value[1],
    'malformed mod, remainder not a number',
  )

  if (!divisor.isInt() || !remainder.isInt()) {
    throw new TypeError('Unable to coerce NaN/Inf to integral type')
  }

  return [arg.value[0], arg.value[1]] as const
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/regex/
 */
function $regexStrict(input: BSONNode, regex: RegexNode): BooleanNode {
  if (input.kind !== NodeKind.STRING) {
    return nBoolean(false)
  }
  return nBoolean(regex.value.test(input.value))
}

withParsing($regexStrict, arg => {
  if (arg.kind === NodeKind.REGEX) {
    return [arg] as const
  }

  if (arg.kind === NodeKind.STRING) {
    const regex = unwrapRegex('$regex', arg, '$regex', nNullish(), '$options')
    return [{ kind: NodeKind.REGEX, value: regex }] as const
  }

  // Hacked "parent" object (see `match.ts`)
  const obj = assertBSON(arg, NodeKind.OBJECT).value

  const regex = unwrapRegex(
    '$regex',
    expected(obj.$regex),
    '$regex',
    obj.$options || nNullish(),
    '$options',
  )

  return [{ kind: NodeKind.REGEX, value: regex }] as const
})

export const $regex = withArrayUnwrap($regexStrict)
