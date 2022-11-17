import { declareOperatorError } from '../error.mjs'
import { compileReader } from '../path.mjs'
import { isArray, isNullish } from '../util.mjs'
import { $eq } from '../filter/eq.mjs'

const OperatorError = declareOperatorError('$pullAll')

export function $pullAll (key, arg) {
  if (!isArray(arg)) {
    throw new OperatorError(
      'Operator $pullAll expects an array',
      { argument: arg }
    )
  }

  const read = compileReader(key)
  const fns = arg.map($eq)

  return doc => {
    const items = read(doc)
    if (isNullish(items)) {
      return
    } else if (!isArray(items)) {
      throw new OperatorError(
        'Operator $pullAll expects an array',
        {
          key,
          argument: arg,
          document: doc,
          value: items
        }
      )
    }

    for (const fn of fns) {
      let ok = true
      while (ok) {
        const index = items.findIndex(fn)

        if (index >= 0) {
          items.splice(index, 1)
        } else {
          ok = false
        }
      }
    }
  }
}
