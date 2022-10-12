import { isObjectLike, isPlainObject } from './util.mjs'

import { $inc } from './operators/inc.mjs'
import { $mul } from './operators/mul.mjs'
import { $pop } from './operators/pop.mjs'
import { $rename } from './operators/rename.mjs'
import { $set } from './operators/set.mjs'
import { $unset } from './operators/unset.mjs'

function compileExpression (obj, operator) {
  if (!isPlainObject(obj)) {
    throw new TypeError()
  }
  return Object.keys(obj).map(path => operator(path, obj[path]))
}

function getOperator (key) {
  switch (key) {
    case '$inc':
      return $inc
    case '$mul':
      return $mul
    case '$pop':
      return $pop
    case '$rename':
      return $rename
    case '$set':
      return $set
    case '$unset':
      return $unset
    default:
      throw new Error(`Unsupported update operator: ${key}`)
  }
}

export function compileUpdateQuery (query) {
  if (!isPlainObject(query)) {
    throw new TypeError('Update query must be a plain object')
  }

  const fns = Object.keys(query)
    .map(key => compileExpression(query[key], getOperator(key)))
    .reduce((a, b) => a.concat(b), [])

  return document => {
    if (isObjectLike(document)) {
      for (const fn of fns) {
        fn(document)
      }
    }
    return document
  }
}
