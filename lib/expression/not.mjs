import { isFalsy } from '../bson.mjs'

export function $not (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $not takes exactly 1 argument')
  }
  const map = compile(args[0])
  return (doc, ctx) => isFalsy(map(doc, ctx))
}
