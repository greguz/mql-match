import { declareOperatorError } from '../error.mjs'
import { isArray } from '../util.mjs'

const OperatorError = declareOperatorError('$size')

export function $size (arg, compile) {
  const map = compile(arg)

  return (doc, ctx) => {
    const value = map(doc, ctx)
    if (!isArray(value)) {
      throw new OperatorError(
        'Operator $size expects an array as argument',
        {
          argument: arg,
          document: doc,
          value
        }
      )
    }

    return value.length
  }
}
