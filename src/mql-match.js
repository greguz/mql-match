import { $gt, $gte, $lt, $lte } from './operators/compare.js'
import { $eq, $ne } from './operators/eq.js'
import { $exists } from './operators/exists.js'
import { $in, $nin } from './operators/in.js'
import { $mod } from './operators/mod.js'
import { $regex } from './operators/regex.js'
import { $size } from './operators/size.js'
import { $type } from './operators/type.js'

/**
 * Creates a new context with a new scope variable.
 */
function next (context) {
  const { index } = context

  return {
    ...context,
    index: index + 1,
    variable: `v${index}`
  }
}

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

function $and (context, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Expected expressions array')
  }
  return concat(
    values.map(value => compileQuery(context, value))
  )
}

function $or (context, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Expected expressions array')
  }
  return concat(
    values.map(value => compileQuery(context, value)),
    true
  )
}

function $not (code) {
  return `!(${code})`
}

function callback (context, query) {
  return `${context.variable} => ${compileQuery(context, query)}`
}

function $elemMatch (context, query) {
  return `Array.isArray(${context.variable}) && !!${context.variable}.find(${callback(next(context), query)})`
}

function compileOperator (context, value, key, object = {}) {
  const { variable } = context

  switch (key) {
    case '$elemMatch':
      return $elemMatch(context, value)
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
      return $not(compileExpression(context, value))
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

function compileExpression (context, object) {
  return concat(
    Object.keys(object).map(
      key => compileOperator(context, object[key], key, object)
    )
  )
}

function compileMatchCallback (context, value, key) {
  let code
  if (key === '$and') {
    code = $and(context, value)
  } else if (key === '$nor') {
    code = $not($or(context, value))
  } else if (key === '$or') {
    code = $or(context, value)
  } else if (isObjectLike(value)) {
    code = compileExpression(context, value)
  } else {
    code = $eq(context.variable, value)
  }

  return `${context.variable} => ${code}`
}

function compileQuery (context, query) {
  if (!isObjectLike(query)) {
    throw new TypeError('Expected query object')
  }

  return concat(
    Object.keys(query).map(key => {
      const path = JSON.stringify(key.split('.'))
      const code = compileMatchCallback(next(context), query[key], key)

      return `match(${context.variable}, ${path}, ${code})`
    })
  )
}

export function compile (query) {
  const context = {
    index: 0,
    variable: 'document'
  }

  const fn = new Function(
    'match',
    'document',
    `return ${compileQuery(context, query)}`
  )

  return fn.bind(null, match)
}
