import { declareOperatorError } from '../error.mjs'
import { isArray, isNullish } from '../util.mjs'

const OperatorError = declareOperatorError('$ifNull')

export function $ifNull (arg, compile) {
  if (!isArray(arg) || arg.length < 2) {
    throw new OperatorError(
      'Operator $ifNull expects an array of two expressions at least',
      { argument: arg }
    )
  }

  const fnValues = arg.map(compile)
  const fnFallback = fnValues.pop()

  return (doc, ctx) => {
    for (const fnValue of fnValues) {
      const value = fnValue(doc, ctx)
      if (!isNullish(value)) {
        return value
      }
    }
    return fnFallback(doc, ctx)
  }
}
