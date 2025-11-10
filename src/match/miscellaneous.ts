import { Decimal } from 'decimal.js'

import { isBSONNumber, unwrapNumber, unwrapRegex } from '../lib/bson.js'
import { type MatchOperator, withArrayUnwrap } from '../lib/match.js'
import { type BSONNode, NodeKind, nBoolean, nNullish } from '../lib/node.js'
import { expected } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/mod/
 *
 * Also, starting in MongoDB 5.1 (and 5.0.4), $mod returns an error if the divisor or remainder values evaluate to:
 * - NaN (not a number).
 * - Infinity.
 * - A value that can't be represented using a 64-bit integer.
 */
export function $mod(arg: BSONNode): MatchOperator {
  if (arg.kind !== NodeKind.ARRAY) {
    throw new TypeError('malformed mod, needs to be an array')
  }
  if (arg.value.length !== 2) {
    throw new TypeError('malformed mod, not enough elements')
  }

  const divisor = unwrapNumber(
    arg.value[0],
    'malformed mod, divisor not a number',
  )

  const remainder = unwrapNumber(
    arg.value[1],
    'malformed mod, remainder not a number',
  )

  if (!Number.isInteger(divisor) || !Number.isInteger(remainder)) {
    throw new TypeError('Unable to coerce NaN/Inf to integral type')
  }

  return dividend => {
    if (!isBSONNumber(dividend)) {
      return nBoolean(false)
    }
    return nBoolean(
      Decimal.mod(unwrapNumber(dividend), divisor).equals(remainder),
    )
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/regex/
 */
function $regexStrict(arg: BSONNode): MatchOperator {
  let regex: RegExp
  switch (arg.kind) {
    case NodeKind.OBJECT:
      regex = unwrapRegex(
        '$regex',
        expected(arg.value.$regex),
        '$regex',
        arg.value.$options || nNullish(),
        '$options',
      )
      break
    case NodeKind.REGEX:
      regex = arg.value
      break
    case NodeKind.STRING:
      regex = unwrapRegex('$regex', arg, '$regex', nNullish(), '$options')
      break
    default:
      throw new TypeError('Unable to parse $regex argument')
  }

  return value => {
    if (value.kind !== NodeKind.STRING) {
      return nBoolean(false)
    }
    return nBoolean(regex.test(value.value))
  }
}

export const $regex = withArrayUnwrap($regexStrict)
