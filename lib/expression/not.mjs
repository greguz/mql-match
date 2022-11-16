import { declareOperatorError } from '../error.mjs'
import { isArray } from '../util.mjs'

const OperatorError = declareOperatorError('$not')

export function $not (arg, compile) {
  if (!isArray(arg) || arg.length !== 1) {
    throw new OperatorError(
      'Operator $not expects an array of one expression',
      { argument: arg }
    )
  }

  const map = compile(arg[0])

  return (doc, ctx) => {
    // TODO: not sure
    return !map(doc, ctx)
  }
}
