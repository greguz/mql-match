import { $eq } from '../filter/eq.mjs'
import { compileReader, compileWriter } from '../path.mjs'
import { isArray, isNullish, isPlainObject } from '../util.mjs'

export function $addToSet (key, arg) {
  const read = compileReader(key)
  const write = compileWriter(key)

  const fn = createMapFunction(extractItems(arg))

  return doc => {
    let items = read(doc)
    if (isNullish(items)) {
      items = []
      write(doc, items)
    } else if (!isArray(items)) {
      throw new TypeError('Operator $addToSet expects an array')
    }
    fn(items)
  }
}

function extractItems (arg) {
  if (isPlainObject(arg)) {
    const keys = Object.keys(arg)
    if (keys.some(key => key[0] === '$')) {
      if (keys.length === 1 && keys[0] === '$each' && isArray(arg.$each)) {
        return arg.$each
      } else {
        throw new Error('Invalid modifier usage')
      }
    }
  }
  return [arg]
}

function createMapFunction (values) {
  const targets = values.map(value => ({
    fn: $eq(value),
    value
  }))

  return items => {
    for (const { fn, value } of targets) {
      if (!items.some(fn)) {
        items.push(value)
      }
    }
  }
}
