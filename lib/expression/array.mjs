import { compileEq } from '../comparison.mjs'
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

export function $in (args, compile) {
  if (args.length !== 2) {
    throw new Error('Expression $in takes exactly 2 arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    const [subject, items] = fns.map(fn => fn(doc, ctx))

    if (!isArray(items)) {
      throw new TypeError(
        'Expression $in requires an array as a second argument'
      )
    }

    return items.some(compileEq(subject))
  }
}

export function $isArray (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $isArray takes exactly 1 argument')
  }
  const map = compile(args[0])
  return (doc, ctx) => isArray(map(doc, ctx))
}

export function $size (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $size takes exactly 1 argument')
  }

  const map = compile(args[0])

  return (doc, ctx) => {
    const value = map(doc, ctx)
    if (!isArray(value)) {
      throw new TypeError('The argument to $size must be an array')
    }
    return value.length
  }
}
