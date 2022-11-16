import { declareOperatorError } from '../error.mjs'
import { isArray } from '../util.mjs'

const OperatorError = declareOperatorError('$or')

export function $or (arg, compile) {
  if (!isArray(arg)) {
    throw new OperatorError(
      'Operator $or expects an array or expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    for (const fn of fns) {
      const value = fn(doc, ctx)
      if (value) { // TODO: not sure
        return true
      }
    }

    return false
  }
}
