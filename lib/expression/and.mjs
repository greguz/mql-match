import { declareOperatorError } from '../error.mjs'
import { isArray } from '../util.mjs'

const OperatorError = declareOperatorError('$and')

export function $and (arg, compile) {
  if (!isArray(arg)) {
    throw new OperatorError(
      'Operator $and expects an array',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    for (const fn of fns) {
      const value = fn(doc, ctx)
      if (!value) { // TODO: not sure
        return false
      }
    }

    return true
  }
}
