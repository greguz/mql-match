import {
  $eq as $eqStrict,
  $gte as $gteStrict,
  $gt as $gtStrict,
  $lte as $lteStrict,
  $lt as $ltStrict,
} from '../expression/comparison.js'
import { assertBSON } from '../lib/bson.js'
import { type MatchOperator, withArrayUnwrap } from '../lib/match.js'
import { type BSONNode, NodeKind, nBoolean } from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/eq/
 */
export const $eq = withArrayUnwrap(right => left => $eqStrict(left, right))

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/gt/
 */
export const $gt = withArrayUnwrap(right => left => $gtStrict(left, right))

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/gte/
 */
export const $gte = withArrayUnwrap(right => left => $gteStrict(left, right))

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/lt/
 */
export const $lt = withArrayUnwrap(right => left => $ltStrict(left, right))

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/lte/
 */
export const $lte = withArrayUnwrap(right => left => $lteStrict(left, right))

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/in/
 */
export function $in(arg: BSONNode): MatchOperator {
  const fns: MatchOperator[] = assertBSON(
    arg,
    NodeKind.ARRAY,
    '$in needs an array',
  ).value.map(n => (n.kind === NodeKind.REGEX ? matchRegex(n.value) : $eq(n)))

  return value => {
    let result = nBoolean(false)
    for (let i = 0; i < fns.length && !result.value; i++) {
      result = fns[i](value)
    }
    return result
  }
}

function matchRegex(regex: RegExp): MatchOperator {
  return value =>
    nBoolean(value.kind === NodeKind.STRING ? regex.test(value.value) : false)
}
