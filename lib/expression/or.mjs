import { isTruthy } from '../bson.mjs'

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
