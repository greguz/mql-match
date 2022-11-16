import { isArray } from '../util.mjs'

export function $isArray (arg, compile) {
  // TODO: docs are not clear
  const map = compile(isArray(arg) && arg.length === 1 ? arg[0] : arg)

  return (doc, ctx) => {
    return isArray(map(doc, ctx))
  }
}
