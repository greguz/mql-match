import { isArray } from '../util.mjs'

export function $isArray (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $isArray takes exactly 1 argument')
  }
  const map = compile(args[0])
  return (doc, ctx) => isArray(map(doc, ctx))
}
