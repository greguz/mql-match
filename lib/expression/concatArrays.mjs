import { declareOperatorError } from '../error.mjs'
import { isArray, isNullish } from '../util.mjs'

const OperatorError = declareOperatorError('$concatArrays')

export function $concatArrays (arg, compile) {
  if (!isArray(arg)) {
    throw new OperatorError(
      'Operator $concatArrays expects an array',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    let result = []
    for (const fn of fns) {
      const value = fn(doc, ctx)
      if (isNullish(value)) {
        return null
      } else if (isArray(value)) {
        result = result.concat(value)
      } else {
        throw new OperatorError(
          'Operator $concatArrays handles array or nullish values',
          {
            argument: arg,
            document: doc,
            value
          }
        )
      }
    }

    return result
  }
}
