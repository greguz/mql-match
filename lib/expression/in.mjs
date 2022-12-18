import { compileEq } from '../comparison.mjs'
import { isArray } from '../util.mjs'

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
