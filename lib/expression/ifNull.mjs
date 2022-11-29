import { isNullish } from '../util.mjs'

export function $ifNull (args, compile) {
  if (args.length < 2) {
    throw new Error('Expression $ifNull needs at least two arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    for (const fn of fns) {
      const value = fn(doc, ctx)
      if (!isNullish(value)) {
        return value
      }
    }
    return null
  }
}
