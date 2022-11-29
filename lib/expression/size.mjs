import { isArray } from '../util.mjs'

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
