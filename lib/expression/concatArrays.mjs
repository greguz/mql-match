import { isArray, isNullish } from '../util.mjs'

export function $concatArrays (args, compile) {
  const fns = args.map(compile)

  return (doc, ctx) => {
    let result = []

    for (const fn of fns) {
      const value = fn(doc, ctx)

      if (isNullish(value)) {
        return null
      } else if (isArray(value)) {
        result = result.concat(value)
      } else {
        throw new TypeError('Expression $concatArrays only supports arrays')
      }
    }

    return result
  }
}
