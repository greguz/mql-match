import { ObjectId } from 'bson'

import { isObjectLike, isPlainObject, isUndefined } from './util.mjs'

import { $inc } from './update/inc.mjs'
import { $mul } from './update/mul.mjs'
import { $pop } from './update/pop.mjs'
import { $pull } from './update/pull.mjs'
import { $push } from './update/push.mjs'
import { $rename } from './update/rename.mjs'
import { $set } from './update/set.mjs'
import { $setOnInsert } from './update/setOnInsert.mjs'
import { $unset } from './update/unset.mjs'

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
