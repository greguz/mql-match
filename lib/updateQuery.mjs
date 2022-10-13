import { ObjectId } from 'bson'

import { isObjectLike, isPlainObject, isUndefined } from './util.mjs'

import { $inc } from './operators/inc.mjs'
import { $mul } from './operators/mul.mjs'
import { $pop } from './operators/pop.mjs'
import { $pull } from './operators/pull.mjs'
import { $push } from './operators/push.mjs'
import { $rename } from './operators/rename.mjs'
import { $set } from './operators/set.mjs'
import { $setOnInsert } from './operators/setOnInsert.mjs'
import { $unset } from './operators/unset.mjs'

const operators = {
  $inc,
  $mul,
  $pop,
  $pull,
  $push,
  $rename,
  $set,
  $setOnInsert,
  $unset
}

function getOperator (key) {
  const operator = operators[key]
  if (!operator) {
    throw new Error(`Unsupported update operator: ${key}`)
  }
  return operator
}

function compileExpression (obj, operator) {
  if (!isPlainObject(obj)) {
    throw new TypeError('An update expression must be an object')
  }
  return Object.keys(obj).map(path => operator(path, obj[path]))
}

export function compileUpdateQuery (query) {
  if (!isPlainObject(query)) {
    throw new TypeError('Update query must be a plain object')
  }

  const fns = Object.keys(query)
    .map(key => compileExpression(query[key], getOperator(key)))
    .reduce((a, b) => a.concat(b), [])

  return (document, insert) => {
    if (isObjectLike(document)) {
      const ctx = {
        insert: insert === true
      }
      if (ctx.insert && isUndefined(document._id)) {
        document._id = new ObjectId()
      }
      for (const fn of fns) {
        fn(document, ctx)
      }
    }
    return document
  }
}
