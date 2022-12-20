import { eq, gt, gte, lt, lte, ne } from '../comparison.mjs'
import { bind } from '../util.mjs'

function cmp (left, right) {
  if (lt(left, right)) {
    return -1
  } else if (gt(left, right)) {
    return 1
  } else {
    return 0
  }
}

function $operator (callback, args, compile, operator) {
  if (args.length !== 2) {
    throw new Error(`Expression ${operator} takes exactly 2 arguments`)
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [left, right] = fns.map(fn => fn(doc, ctx))
    return callback(left, right)
  }
}

export const $cmp = bind($operator, cmp)
export const $eq = bind($operator, eq)
export const $gt = bind($operator, gt)
export const $gte = bind($operator, gte)
export const $lt = bind($operator, lt)
export const $lte = bind($operator, lte)
export const $ne = bind($operator, ne)
