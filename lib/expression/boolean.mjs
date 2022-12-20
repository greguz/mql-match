import { isFalsy, isTruthy } from '../bson.mjs'

export function $and (args, compile) {
  const fns = args.map(compile)

  return (doc, ctx) => {
    for (const fn of fns) {
      if (isFalsy(fn(doc, ctx))) {
        return false
      }
    }
    return true
  }
}

export function $or (args, compile) {
  const fns = args.map(compile)

  return (doc, ctx) => {
    for (const fn of fns) {
      if (isTruthy(fn(doc, ctx))) {
        return true
      }
    }
    return false
  }
}

export function $not (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $not takes exactly 1 argument')
  }
  const map = compile(args[0])
  return (doc, ctx) => isFalsy(map(doc, ctx))
}
