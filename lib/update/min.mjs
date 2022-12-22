import { compileGt } from '../comparison.mjs'
import { compileReader, compileWriter } from '../path.mjs'

export function $min (key, arg) {
  const read = compileReader(key)
  const write = compileWriter(key)

  const compare = compileGt(arg)

  return doc => {
    if (compare(read(doc))) {
      write(doc, arg)
    }
  }
}
