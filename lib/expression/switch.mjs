import { declareOperatorError } from '../error.mjs'
import { isArray, isPlainObject, isUndefined } from '../util.mjs'

const OperatorError = declareOperatorError('$switch')

export function $switch (arg, compile) {
  if (!isPlainObject(arg)) {
    throw new OperatorError(
      'Operator $switch expects an object',
      { argument: arg }
    )
  }
  if (!isArray(arg.branches)) {
    throw new OperatorError(
      'Operator $switch expects an array of branches',
      { argument: arg }
    )
  }

  const branches = []
  for (const branch of arg.branches) {
    if (!isPlainObject(branch)) {
      throw new OperatorError(
        'Invalid $switch branch found',
        { argument: arg }
      )
    }
    branches.push({
      case: compile(branch.case),
      then: compile(branch.then)
    })
  }

  const fallback = isUndefined(arg.default)
    ? undefined
    : compile(arg.default)

  return (doc, ctx) => {
    for (const branch of branches) {
      if (branch.case(doc, ctx) === true) {
        return branch.then(doc, ctx)
      }
    }
    if (fallback) {
      return fallback(doc, ctx)
    } else {
      return null
    }
  }
}
