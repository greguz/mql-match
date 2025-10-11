import { $gt, $lt } from '../expression/comparison.js'
import { assertNumber, unwrapDecimal, unwrapNumber } from '../lib/bson.js'
import {
  type BSONNode,
  NodeKind,
  nDate,
  nDouble,
  nNullish,
  nString,
  nTimestamp,
} from '../lib/node.js'
import { withArguments, withParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/currentDate/
 */
export function $currentDate(_left: BSONNode, right: BSONNode): BSONNode {
  return right.value === 'timestamp' ? nTimestamp() : nDate()
}

withParsing($currentDate, arg => {
  if (arg.kind === NodeKind.BOOLEAN && arg.value === true) {
    return [nString('date')]
  }
  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError(
      `${arg.kind} is not valid type for $currentDate. Please use a boolean ('true') or a $type expression ({ $type: 'timestamp/date' }).`,
    )
  }

  const dateType = arg.value.$type || nNullish()
  if (dateType.value !== 'date' && dateType.value !== 'timestamp') {
    throw new TypeError(
      `The '$type' string field is required to be 'date' or 'timestamp': { $currentDate: { field : { $type: 'date' } } }`,
    )
  }

  return [dateType]
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/inc/
 */
export function $inc(left: BSONNode, right: BSONNode): BSONNode {
  if (left.kind === NodeKind.NULLISH) {
    return right
  }

  return nDouble(
    unwrapDecimal(
      left,
      `Cannot apply $inc to a value of non-numeric type (got ${left.kind})`,
    ).add(unwrapNumber(right)),
  )
}

withParsing($inc, right => [
  nDouble(unwrapNumber(right, 'Cannot increment with non-numeric argument')),
])

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/min/
 */
export function $min(left: BSONNode, right: BSONNode): BSONNode {
  if (left.kind === NodeKind.NULLISH) {
    return right
  }
  return $lt(right, left).value ? right : left
}

withArguments($min, 1)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/max/
 */
export function $max(left: BSONNode, right: BSONNode): BSONNode {
  if (left.kind === NodeKind.NULLISH) {
    return right
  }
  return $gt(right, left).value ? right : left
}

withArguments($max, 1)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/mul/
 */
export function $mul(left: BSONNode, right: BSONNode): BSONNode {
  if (left.kind === NodeKind.NULLISH) {
    return nDouble(0)
  }
  return nDouble(
    unwrapDecimal(
      left,
      `Cannot apply $mul to a value of non-numeric type (got ${left.kind})`,
    ).mul(unwrapNumber(right)),
  )
}

withParsing($mul, arg => [
  assertNumber(arg, 'Cannot multiply with non-numeric argument'),
])

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/rename/
 */
export function $rename(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $rename')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/set/
 */
export function $set(_left: BSONNode, right: BSONNode): BSONNode {
  return right
}

withArguments($set, 1)

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/setOnInsert/
 */
export function $setOnInsert(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $setOnInsert')
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/unset/
 */
export function $unset(left: BSONNode, right: BSONNode): BSONNode {
  throw new Error('TODO: $unset')
}
