import { $eq } from '../filter/eq.mjs'
import { compileReader } from '../path.mjs'
import { isArray, isNullish } from '../util.mjs'

export function $pullAll (key, arg) {
  if (!isArray(arg)) {
    throw new TypeError('Operator $pullAll expects an array')
  }

  const read = compileReader(key)
  const fns = arg.map($eq)

  return doc => {
    const items = read(doc)
    if (isNullish(items)) {
      return
    } else if (!isArray(items)) {
      throw new TypeError('Operator $pullAll expects an array')
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
