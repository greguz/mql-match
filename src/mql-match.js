import { $all } from './operators/all.js'
import { $gt, $gte, $lt, $lte } from './operators/compare.js'
import { $eq, $ne } from './operators/eq.js'
import { $exists } from './operators/exists.js'
import { $in, $nin } from './operators/in.js'
import { $mod } from './operators/mod.js'
import { $regex } from './operators/regex.js'
import { $size } from './operators/size.js'
import { $type } from './operators/type.js'

/**
 * Object type but not null
 */
function isObjectLike (value) {
  return typeof value === 'object' && value !== null
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
  if (value === undefined || path.length <= 0) {
    return callback(value)
  }

  if (match(Object(value)[path[0]], path.slice(1), callback)) {
    return true
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (match(item, path, callback)) {
        return true
      }
    }
  }

  return false
}

/**
 * Concat multiple (code) expressions.
 */
function concat (values, or) {
  if (values.length > 1) {
    return values.map(value => `(${value})`).join(` ${or ? '||' : '&&'} `)
  } else if (values.length === 1) {
    return values[0]
  } else {
    throw new Error('Expected at least one expression')
  }
}

function $and (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Expected expressions array')
  }
  return concat(
    values.map(value => compileQuery(variable, value))
  )
}

function $or (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Expected expressions array')
  }
  return concat(
    values.map(value => compileQuery(variable, value)),
    true
  )
}

function $not (code) {
  return `!(${code})`
}

function $elemMatch (variable, query) {
  return `Array.isArray(${variable}) && ${variable}.findIndex(v => ${compileQuery('v', query)}) >= 0`
}

function compileOperator (variable, value, key, object = {}) {
  switch (key) {
    case '$all':
      return $all(variable, value)
    case '$elemMatch':
      return $elemMatch(variable, value)
    case '$eq':
      return $eq(variable, value)
    case '$exists':
      return $exists(variable, value)
    case '$gt':
      return $gt(variable, value)
    case '$gte':
      return $gte(variable, value)
    case '$in':
      return $in(variable, value)
    case '$lt':
      return $lt(variable, value)
    case '$lte':
      return $lte(variable, value)
    case '$mod':
      return $mod(variable, value)
    case '$ne':
      return $ne(variable, value)
    case '$nin':
      return $nin(variable, value)
    case '$not':
      return $not(compileExpression(variable, value))
    case '$regex':
      return $regex(variable, value, object.$options)
    case '$size':
      return $size(variable, value)
    case '$type':
      return $type(variable, value)
    default:
      throw new Error(`Unknown operator "${key}"`)
  }
}

function compileExpression (variable, object) {
  const keys = Object.keys(object)

  const properties = keys.filter(key => key[0] !== '$')
  if (properties.length > 0) {
    throw new Error('Object matching not supported')
  }

  const operators = keys.filter(key => key[0] === '$')
  return concat(
    operators.map(
      key => compileOperator(variable, object[key], key, object)
    )
  )
}

function compileMatchCallback (variable, value, key) {
  if (key === '$and') {
    return $and(variable, value)
  } else if (key === '$nor') {
    return $not($or(variable, value))
  } else if (key === '$or') {
    return $or(variable, value)
  } else if (isObjectLike(value)) {
    return compileExpression(variable, value)
  } else {
    return $eq(variable, value)
  }
}

function compileQuery (variable, query) {
  if (!isObjectLike(query)) {
    throw new TypeError('Expected query object')
  }

  const keys = Object.keys(query).filter(key => key !== '$comment')
  if (keys.length <= 0) {
    return `typeof ${variable} === "object" && ${variable} !== null && Object.getPrototypeOf(${variable}) === Object.prototype`
  }

  return concat(
    keys.map(key => {
      const path = JSON.stringify(key.split('.'))
      const code = compileMatchCallback('v', query[key], key)

      return `match(${variable}, ${path}, v => ${code})`
    })
  )
}

export function compile (query = {}) {
  const fn = new Function(
    'match',
    'document',
    `return ${compileQuery('document', query)}`
  )

  return fn.bind(null, match)
}
