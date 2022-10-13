import { parsePath } from './path.mjs'
import { isArray, isPlainObject } from './util.mjs'

import { $all } from './filter/all.mjs'
import { $gt, $gte, $lt, $lte } from './filter/compare.mjs'
import { $eq } from './filter/eq.mjs'
import { $exists } from './filter/exists.mjs'
import { $in } from './filter/in.mjs'
import { $and, $nor, $not, $or } from './filter/logic.mjs'
import { $mod } from './filter/mod.mjs'
import { $regex } from './filter/regex.mjs'
import { $size } from './filter/size.mjs'
import { $type } from './filter/type.mjs'

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
    ? compileFilterQuery(spec)
    : compileOperatorsExpression(spec)

  return value => Array.isArray(value) && value.findIndex(fn) >= 0
}

function compileExpressionKey (obj, key) {
  const spec = obj[key]
  switch (key) {
    case '$and':
      return $and(compileLogicalSequence(spec))
    case '$nor':
      return $nor(compileLogicalSequence(spec))
    case '$or':
      return $or(compileLogicalSequence(spec))
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
      return $not(compileOperatorsExpression(spec))
    case '$regex':
      return $regex(spec, obj.$options)
    case '$size':
      return $size(spec)
    case '$type':
      return $type(spec)
    default:
      throw new Error(`Unsupported filter operator: ${key}`)
  }
}

function compileOperatorsExpression (obj) {
  return $and(
    getKeys(obj).map(
      key => compileExpressionKey(obj, key)
    )
  )
}

function compilePathsExpression (obj) {
  return $and(
    Object.keys(obj).map(
      key => bind(compileFilterQuery(obj[key]), parsePath(key))
    )
  )
}

function bind (callback, path) {
  return value => match(value, path, callback)
}

function compileLogicalSequence (sequence) {
  if (!Array.isArray(sequence)) {
    throw new TypeError('Expected logical (array) sequence')
  }
  return sequence.map(compileFilterQuery)
}

export function compileFilterQuery (query = {}) {
  const objectMode = isPlainObject(query)
  const keys = objectMode ? getKeys(query) : []

  const operators = keys.filter(key => key[0] === '$')
  const properties = keys.filter(key => key[0] !== '$')

  if (operators.length > 0 && properties.length > 0) {
    throw new Error(`Misplaced operator ${operators[0]}`)
  } else if (operators.length > 0) {
    return compileOperatorsExpression(query)
  } else if (properties.length > 0) {
    return compilePathsExpression(query)
  } else {
    return $eq(objectMode ? {} : query)
  }
}
