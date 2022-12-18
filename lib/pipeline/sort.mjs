import { gt, lt } from '../comparison.mjs'
import { compileReader } from '../path.mjs'
import { isPlainObject } from '../util.mjs'

export function $sort (expression) {
  if (!isPlainObject(expression)) {
    throw new TypeError('Stage $sort expects an object')
  }
  const compare = compileExpressionObject(expression)
  return async function * unsetStage (iterable) {
    const documents = []
    for await (const document of iterable) {
      documents.push(document)
    }
    for (const document of documents.sort(compare)) {
      yield document
    }
  }
}

function compileExpressionObject (obj) {
  const keys = Object.keys(obj)
  if (keys.length > 32) {
    throw new Error('Maximum 32 keys are allowed for sorting')
  }

  const fns = keys.map(key => {
    const value = obj[key]
    if (value === 1) {
      return sortAsc(key)
    } else if (value === -1) {
      return sortDesc(key)
    } else {
      throw new Error(`Unsupported sorting order: ${value}`)
    }
  })

  return (a, b) => {
    for (const fn of fns) {
      const value = fn(a, b)
      if (value !== 0) {
        return value
      }
    }
    return 0
  }
}

function sortAsc (key) {
  const read = compileReader(key)
  return (a, b) => {
    const left = read(a)
    const right = read(b)

    if (lt(left, right)) {
      return -1
    } else if (gt(left, right)) {
      return 1
    } else {
      return 0
    }
  }
}

function sortDesc (key) {
  const read = compileReader(key)
  return (a, b) => {
    const left = read(a)
    const right = read(b)

    if (lt(left, right)) {
      return 1
    } else if (gt(left, right)) {
      return -1
    } else {
      return 0
    }
  }
}
