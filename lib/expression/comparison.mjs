import { eq, gt, gte, lt, lte, ne } from '../comparison.mjs'

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

export const $cmp = $operator.bind(null, cmp)
export const $eq = $operator.bind(null, eq)
export const $gt = $operator.bind(null, gt)
export const $gte = $operator.bind(null, gte)
export const $lt = $operator.bind(null, lt)
export const $lte = $operator.bind(null, lte)
export const $ne = $operator.bind(null, ne)
