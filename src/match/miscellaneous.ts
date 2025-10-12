import { Decimal } from 'decimal.js'

import { $regexMatch } from '../expression/string.js'
import {
  assertBSON,
  isBSONNumber,
  unwrapDecimal,
  unwrapNumber,
} from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nNullish,
} from '../lib/node.js'
import { withQueryParsing } from '../lib/operator.js'
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

withQueryParsing($mod, arg => {
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
export function $regex(
  input: BSONNode,
  regex: BSONNode,
  options: BSONNode,
): BooleanNode {
  // TODO: strange modes?
  return input.kind === NodeKind.STRING
    ? $regexMatch(input, regex, options)
    : nBoolean(false)
}

withQueryParsing($regex, arg => {
  // Hacked "parent" object (see `match.ts`)
  const obj = assertBSON(arg, NodeKind.OBJECT).value

  // Always present because hacked
  const regexNode = expected(obj.$regex)
  if (regexNode.kind !== NodeKind.REGEX && regexNode.kind !== NodeKind.STRING) {
    throw new TypeError('$regex has to be a string or regex')
  }

  // TODO: escape?
  let regex: RegExp =
    regexNode.kind === NodeKind.REGEX
      ? regexNode.value
      : new RegExp(regexNode.value)

  const optionsNode = obj.$options
  if (optionsNode) {
    const flags = assertBSON(
      optionsNode,
      NodeKind.STRING,
      '$options has to be a string',
    ).value

    if (regex.flags) {
      throw new TypeError('options set in both $regex and $options')
    }

    // Inject flags
    regex = new RegExp(regex, flags)
  }

  return [{ kind: NodeKind.REGEX, value: regex }, nNullish()] as const
})
