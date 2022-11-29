import * as ops from '../filter/compare.mjs'
import { $eq as equals } from '../filter/eq.mjs'

export function $gt (args, compile) {
  return build('$gt', args, compile, (l, r) => ops.$gt(r)(l))
}

export function $gte (args, compile) {
  return build('$gte', args, compile, (l, r) => ops.$gte(r)(l))
}

export function $lt (args, compile) {
  return build('$lt', args, compile, (l, r) => ops.$lt(r)(l))
}

export function $lte (args, compile) {
  return build('$lte', args, compile, (l, r) => ops.$lte(r)(l))
}

export function $eq (args, compile) {
  return build('$eq', args, compile, (l, r) => equals(r)(l))
}

export function $ne (args, compile) {
  return build('$ne', args, compile, (l, r) => !equals(r)(l))
}

export function $cmp (args, compile) {
  return build('$cmp', args, compile, (l, r) => {
    if (ops.$lt(r)(l)) {
      return -1
    } else if (ops.$gt(r)(l)) {
      return 1
    } else {
      return 0
    }
  })
}

function build (operator, args, compile, compare) {
  if (args.length !== 2) {
    throw new Error(`Expression ${operator} takes exactly 2 arguments`)
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [left, right] = fns.map(fn => fn(doc, ctx))
    return compare(left, right)
  }
}
