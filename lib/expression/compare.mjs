import { MqlError } from '../error.mjs'
import { isArray } from '../util.mjs'
import * as ops from '../filter/compare.mjs'
import { $eq as equals } from '../filter/eq.mjs'

function $compare (operator, arg, compile, compare) {
  if (!isArray(arg) || arg.length !== 2) {
    throw new MqlError(
      'MQL_OPERATOR_INVALID_ARGUMENT',
      `Operator ${operator} expects an array of two expressions'`,
      {
        operator,
        argument: arg
      }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const [left, right] = fns.map(fn => fn(doc, ctx))
    return compare(left, right)
  }
}

export function $gt (arg, compile) {
  return $compare('$gt', arg, compile, (l, r) => ops.$gt(r)(l))
}

export function $gte (arg, compile) {
  return $compare('$gte', arg, compile, (l, r) => ops.$gte(r)(l))
}

export function $lt (arg, compile) {
  return $compare('$lt', arg, compile, (l, r) => ops.$lt(r)(l))
}

export function $lte (arg, compile) {
  return $compare('$lte', arg, compile, (l, r) => ops.$lte(r)(l))
}

export function $eq (arg, compile) {
  return $compare('$eq', arg, compile, (l, r) => equals(r)(l))
}

export function $ne (arg, compile) {
  return $compare('$ne', arg, compile, (l, r) => !equals(r)(l))
}

export function $cmp (arg, compile) {
  return $compare('$cmp', arg, compile, (l, r) => {
    if (ops.$lt(r)(l)) {
      return -1
    } else if (ops.$gt(r)(l)) {
      return 1
    } else {
      return 0
    }
  })
}
