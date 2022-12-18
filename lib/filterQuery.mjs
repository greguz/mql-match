import { parsePath } from './path.mjs'
import { and, isArray, isPlainObject, nor, not, or } from './util.mjs'

import { $all } from './filter/all.mjs'
import { $eq, $gt, $gte, $lt, $lte } from './filter/comparison.mjs'
import { $exists } from './filter/exists.mjs'
import { $in } from './filter/in.mjs'
import { $mod } from './filter/mod.mjs'
import { $regex } from './filter/regex.mjs'
import { $size } from './filter/size.mjs'
import { $type } from './filter/type.mjs'

const uselessKeys = [
  '$comment',
  '$options' // RegExp flags
]

const operators = {
  $all,
  $and: and,
  $elemMatch,
  $eq,
  $exists,
  $gt,
  $gte,
  $in,
  $lt,
  $lte,
  $mod,
  $ne: spec => not($eq(spec)),
  $nin: spec => not($in(spec)),
  $nor: nor,
  $not: spec => not(compileExpressionObject(spec)),
  $or: or,
  $regex: (spec, obj) => $regex(spec, obj.$options),
  $size,
  $type
}

/**
 * Get only useful object keys.
 */
function getKeys (obj) {
  return Object.keys(obj).filter(key => !uselessKeys.includes(key))
}

/**
 * Recursive matching function.
 * This version will return true if **ANY** element inside an array matches with the spec function.
 */
function positiveMatch (check, path, value) {
  if (path.length === 0) {
    if (check(value)) {
      return true
    }
  }

  if (isArray(value)) {
    for (const item of value) {
      if (positiveMatch(check, path, item)) {
        return true
      }
    }
  } else if (path.length > 0 && isPlainObject(value)) {
    return positiveMatch(check, path.slice(1), value[path[0]])
  }

  return false
}

/**
 * Recursive matching function.
 * This version will return true if **ALL** elements inside an array matches with the spec function.
 */
function negativeMatch (check, path, value) {
  if (path.length === 0) {
    if (check(value)) {
      return true
    }
  }

  if (isArray(value)) {
    for (const item of value) {
      if (!negativeMatch(check, path, item)) {
        return false
      }
    }
    return true
  } else if (path.length > 0 && isPlainObject(value)) {
    return negativeMatch(check, path.slice(1), value[path[0]])
  }

  return false
}

/**
 * This operator is a recursive, leave It here.
 */
function $elemMatch (spec) {
  if (!isPlainObject(spec)) {
    throw new TypeError('Operator $elemMatch needs a query object')
  }
  const fn = compileExpressionObject(spec)
  return value => Array.isArray(value) && value.findIndex(fn) >= 0
}

function compileOperatorKey (obj, key) {
  const fn = operators[key]
  if (!fn) {
    throw new Error(`Unsupported filter operator: ${key}`)
  }
  return fn(obj[key], obj)
}

export function compileFilterQuery (query = {}) {
  return isPlainObject(query)
    ? compileExpressionObject(query)
    : $eq(query)
}

function compileExpressionObject (obj) {
  if (!isPlainObject(obj)) {
    throw new TypeError('Expected expression object')
  }
  return and(getKeys(obj).map(key => compileExpressionKey(obj, key)))
}

function compileExpressionKey (query, key) {
  const spec = query[key]
  if (key === '$and') {
    return and(compileLogicalSequence(spec))
  } else if (key === '$nor') {
    return nor(compileLogicalSequence(spec))
  } else if (key === '$or') {
    return or(compileLogicalSequence(spec))
  } else if (key[0] === '$') {
    return compileOperatorKey(query, key)
  } else {
    const { check, negated } = compileExpressionValue(spec)
    const match = negated ? negativeMatch : positiveMatch
    return match.bind(null, check, parsePath(key))
  }
}

function compileLogicalSequence (sequence) {
  if (!Array.isArray(sequence)) {
    throw new TypeError('Expected logical (array) sequence')
  }
  return sequence.map(compileExpressionObject)
}

function compileExpressionValue (spec) {
  const keys = isPlainObject(spec) ? getKeys(spec) : []
  if (keys.findIndex(key => key[0] === '$') >= 0) {
    return {
      check: and(
        keys.map(
          key => compileOperatorKey(spec, key)
        )
      ),
      negated: keys.some(key => key === '$ne' || key === '$not')
    }
  } else {
    return {
      check: $eq(spec),
      negated: false
    }
  }
}
