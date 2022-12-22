import { compileLt } from '../comparison.mjs'
import { compileReader, compileWriter } from '../path.mjs'

export function $max (key, arg) {
  const read = compileReader(key)
  const write = compileWriter(key)

  const compare = compileLt(arg)

  return doc => {
    if (compare(read(doc))) {
      write(doc, arg)
    }
  }
}
