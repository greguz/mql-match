import { _and, _compile, _or } from './code.mjs'
import { isObjectLike } from './utils.mjs'

import { $all } from './operators/all.mjs'
import { $gt, $gte, $lt, $lte } from './operators/compare.mjs'
import { $eq, $ne } from './operators/eq.mjs'
import { $exists } from './operators/exists.mjs'
import { $in, $nin } from './operators/in.mjs'
import { $mod } from './operators/mod.mjs'
import { $regex } from './operators/regex.mjs'
import { $size } from './operators/size.mjs'
import { $type } from './operators/type.mjs'

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

// { "a.b": 0 }
// { a: [[[[[[[[[[{ b: 0 }]]]]]]]]]] }

function $elemMatch (variable, value) {
  if (!isObjectLike(value)) {
    throw new TypeError('Operator $elemMatch needs a query object')
  }

  const keys = Object.keys(value)

  const directMatch = keys.find(key => key[0] === '$' && key !== '$and' && key !== '$nor' && key !== '$or')

  const code = !directMatch
    ? compileQuery('v', value)
    : compileOperatorsExpression('v', value)

  return `Array.isArray(${variable}) && ${variable}.findIndex(v => ${code}) >= 0`
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
      return `!(${compileOperatorsExpression(variable, value)})`
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

function compileOperatorsExpression (variable, value) {
  if (!isObjectLike(value)) {
    throw new Error('Expected operators expression')
  }
  return _and(
    Object.keys(value).map(
      key => compileOperator(variable, value[key], key, value)
    )
  )
}

function compileValueMatching (variable, value) {
  if (!isObjectLike(value)) {
    return $eq(variable, value)
  }

  const keys = Object.keys(value)
  const operators = keys.filter(key => key[0] === '$')
  const properties = keys.filter(key => key[0] !== '$')

  if (operators.length > 0 && properties.length > 0) {
    throw new Error(`Misplaced operator ${operators[0]}`)
  } else if (operators.length > 0) {
    return compileOperatorsExpression(variable, value)
  } else {
    return $eq(variable, value)
  }
}

function $and (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Operator $and needs an array of expressions')
  }
  if (values.length <= 0) {
    throw new Error('Operator $and needs at least one expression')
  }
  return _and(values.map(value => compileQuery(variable, value)))
}

function $nor (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Operator $nor needs an array of expressions')
  }
  if (values.length <= 0) {
    throw new Error('Operator $nor needs at least one expression')
  }
  return `!(${$or(variable, values)})`
}

function $or (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Operator $or needs an array of expressions')
  }
  if (values.length <= 0) {
    throw new Error('Operator $or needs at least one expression')
  }
  return _or(values.map(value => compileQuery(variable, value)))
}

function compileQueryProperty (variable, value, key) {
  switch (key) {
    case '$and':
      return $and(variable, value)
    case '$nor':
      return $nor(variable, value)
    case '$or':
      return $or(variable, value)
    default:
      return `match(${variable}, ${JSON.stringify(key.split('.'))}, v => ${compileValueMatching('v', value)})`
  }
}

function compileQuery (variable, query) {
  if (!isObjectLike(query)) {
    throw new Error('Expected filter query object')
  }

  const keys = Object.keys(query).filter(key => key !== '$comment')
  if (keys.length <= 0) {
    return variable === 'document'
      ? `typeof ${variable} === "object" && ${variable} !== null && Object.getPrototypeOf(${variable}) === Object.prototype`
      : 'true'
  }

  return _and(keys.map(key => compileQueryProperty(variable, query[key], key)))
}

export function compileFilterQuery (query = {}) {
  const variable = 'document'
  return _compile({
    arguments: [variable],
    body: `return ${compileQuery(variable, query)}`,
    context: { match }
  })
}

// const query = {
//   a: {
//     $exists: true
//   }
// }

// function matchQuery (query, value) {
//   if (typeof query.$exists !== 'boolean') {
//     throw new Error()
//   }
// }

// const documents = [
//   {}, {}, {}
// ]

// for (const document of documents) {
//   if (matchQuery(query, document)) {
//     console.log('Weeeee')
//   }
// }
