import { getTypeWeight, isNumber, n } from '../bson.mjs'
import { compileReader, compileWriter } from '../path.mjs'
import { isDate } from '../util.mjs'

export function $max (key, arg) {
  arg = n(arg)

  const read = compileReader(key)
  const write = compileWriter(key)

  return doc => {
    const current = n(read(doc))

    if ((isNumber(arg) && isNumber(current)) || (isDate(arg) && isDate(current))) {
      if (arg > current) {
        write(doc, arg)
      }
    } else if (getTypeWeight(arg) > getTypeWeight(current)) {
      write(doc, arg)
    }
  }
}
