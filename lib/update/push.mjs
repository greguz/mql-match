import { compileReader, compileWriter } from '../path.mjs'
import { isArray, isPlainObject, isUndefined } from '../util.mjs'

export function $push (key, data) {
  const readValue = compileReader(key)
  const writeValue = compileWriter(key)
  const fn = createMapFunction(data)
  return document => {
    let items = readValue(document)
    if (isUndefined(items)) {
      items = []
      writeValue(document, items)
    } else if (!isArray(items)) {
      throw new Error('Operator $push expects an array')
    }
    fn(items)
  }
}

function createMapFunction (data) {
  if (isPlainObject(data) && isArray(data.$each)) {
    return compileModifiers(data)
  } else {
    return items => items.push(data)
  }
}

function compileModifiers (obj) {
  const fns = [
    isUndefined(obj.$position)
      ? $position(Number.POSITIVE_INFINITY, obj.$each)
      : $position(obj.$position, obj.$each)
  ]
  if (!isUndefined(obj.$sort)) {
    fns.push($sort(obj.$sort))
  }
  if (!isUndefined(obj.$slice)) {
    fns.push($slice(obj.$slice))
  }
  return compose(fns)
}

function $position (index, newItems) {
  if (index === Number.POSITIVE_INFINITY) {
    return oldItems => oldItems.push(...newItems)
  } else if (Number.isInteger(index)) {
    return oldItems => oldItems.splice(index, 0, ...newItems)
  } else {
    throw new TypeError('Modifier $position expects an integer value')
  }
}

function $slice (value) {
  if (!Number.isInteger(value)) {
    throw new TypeError('Modifier $slice expects an integer value')
  } else if (value >= 0) {
    return items => items.splice(value, items.length)
  } else {
    return items => items.splice(0, items.length - value)
  }
}

function $sort (obj) {
  if (!isPlainObject(obj)) {
    throw new TypeError('Modifier $sort expects an object')
  }
  const keys = Object.keys(obj)
  if (keys.length <= 0) {
    return () => {}
  } else if (keys.length > 1) {
    // TODO
    throw new Error('Modifier $sort currently supports only one key')
  }

  const [key] = keys

  const order = obj[key]
  if (order !== 1 && order !== -1) {
    throw new TypeError('Modifier $sort needs a valid object specification')
  }

  const readValue = compileReader(key)

  return items => {
    items.sort((a, b) => {
      const va = readValue(a)
      const vb = readValue(b)
      if (va < vb) {
        return -1 * order
      } else if (va > vb) {
        return 1 * order
      } else {
        return 0
      }
    })
  }
}

function compose (fns) {
  return items => {
    for (const fn of fns) {
      fn(items)
    }
  }
}
