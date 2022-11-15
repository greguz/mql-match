import { $eq } from '../filter/eq.mjs'
import { declareOperatorError } from '../error.mjs'
import { isArray } from '../util.mjs'

const OperatorError = declareOperatorError('$in')

export function $in (arg, compile) {
  if (!isArray(arg) || arg.length !== 2) {
    throw new OperatorError(
      'Operator $in expects an array of two expressions',
      { argument: arg }
    )
  }

  const fns = arg.map(compile)

  return (doc, ctx) => {
    const array = fns[1](doc, ctx)
    if (!isArray(array)) {
      throw new OperatorError(
        'Operator $in expects an array as argument',
        {
          argument: arg,
          document: doc,
          value: array
        }
      )
    }

    return array.some($eq(fns[0](doc, ctx)))
  }
}
