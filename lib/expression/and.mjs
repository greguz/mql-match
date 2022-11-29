import { isFalsy } from '../bson.mjs'

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
