import { parsePath } from './path.mjs'
import { isArray, isPlainObject, yes } from './util.mjs'

import { $all } from './operators/all.mjs'
import { $gt, $gte, $lt, $lte } from './operators/compare.mjs'
import { $eq } from './operators/eq.mjs'
import { $exists } from './operators/exists.mjs'
import { $in } from './operators/in.mjs'
import { $and, $nor, $not, $or } from './operators/logic.mjs'
import { $mod } from './operators/mod.mjs'
import { $regex } from './operators/regex.mjs'
import { $size } from './operators/size.mjs'
import { $type } from './operators/type.mjs'

/**
 *
 */
const uselessKeys = [
  '$comment',
  '$options'
]

/**
 * Get only useful object keys.
 */
function getKeys (obj) {
  return Object.keys(obj).filter(key => !uselessKeys.includes(key))
}

/**
 * Recursive MongoDB path matching utility.
 * This function is injected inside the "compiled" code.
 * @param {*} value Current value to match (scope).
 * @param {String[]} path Targeted path.
 * @param {Function} callback Matching function to apply to any targeted value.
 * @returns {Boolean}
 */
function match (value, path, callback) {
  if (path.length > 0 && isPlainObject(value)) {
    if (match(value[path[0]], path.slice(1), callback)) {
      return true
    }
  }

  if (isArray(value)) {
    for (const item of value) {
      if (match(item, path, callback)) {
        return true
      }
    }
  }

  return callback(value)
}

function $elemMatch (spec) {
  if (!isPlainObject(spec)) {
    throw new TypeError('Operator $elemMatch needs a query object')
  }

  const directMatch = getKeys(spec).find(key =>
    key[0] === '$' &&
    key !== '$and' &&
    key !== '$nor' &&
    key !== '$or'
  )

  const fn = !directMatch
    ? compileQuery(spec)
    : compileExpressionOject(spec)

  return value => Array.isArray(value) && value.findIndex(fn) >= 0
}

function compileExpressionKey (obj, key) {
  const spec = obj[key]
  switch (key) {
    case '$all':
      return $all(spec)
    case '$elemMatch':
      return $elemMatch(spec)
    case '$eq':
      return $eq(spec)
    case '$exists':
      return $exists(spec)
    case '$gt':
      return $gt(spec)
    case '$gte':
      return $gte(spec)
    case '$in':
      return $in(spec)
    case '$lt':
      return $lt(spec)
    case '$lte':
      return $lte(spec)
    case '$mod':
      return $mod(spec)
    case '$ne':
      return $not($eq(spec))
    case '$nin':
      return $not($in(spec))
    case '$not':
      return $not(compileExpressionOject(spec))
    case '$regex':
      return $regex(spec, obj.$options)
    case '$size':
      return $size(spec)
    case '$type':
      return $type(spec)
    default:
      throw new Error(`Unknown operator "${key}"`)
  }
}

function compileExpressionOject (obj) {
  if (!isPlainObject(obj)) {
    throw new Error('Expected operators expression')
  }
  return $and(getKeys(obj).map(key => compileExpressionKey(obj, key)))
}

function compileExpression (spec) {
  const keys = isPlainObject(spec) ? getKeys(spec) : []

  const operators = keys.filter(key => key[0] === '$')
  const properties = keys.filter(key => key[0] !== '$')

  if (operators.length > 0 && properties.length > 0) {
    throw new Error(`Misplaced operator ${operators[0]}`)
  } else if (operators.length > 0) {
    return compileExpressionOject(spec)
  } else {
    return $eq(spec)
  }
}

function compileLogicalSequence (sequence) {
  if (!Array.isArray(sequence)) {
    throw new TypeError()
  }
  return sequence.map(compileQuery)
}

function bind (callback, path) {
  return value => match(value, path, callback)
}

function compileQueryKey (query, key) {
  switch (key) {
    case '$and':
      return $and(compileLogicalSequence(query[key]))
    case '$nor':
      return $nor(compileLogicalSequence(query[key]))
    case '$or':
      return $or(compileLogicalSequence(query[key]))
    default:
      return bind(compileExpression(query[key]), parsePath(key))
  }
}

function compileQuery (query) {
  if (!isPlainObject(query)) {
    throw new TypeError()
  }
  const keys = getKeys(query)
  if (keys.length > 0) {
    return $and(keys.map(key => compileQueryKey(query, key)))
  } else {
    return yes
  }
}

export function compileFilterQuery (query) {
  return $and([
    isPlainObject,
    compileQuery(query || {})
  ])
}
