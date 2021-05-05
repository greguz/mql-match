import $eq from './operators/eq.js'
import $exists from './operators/exists.js'
import $in from './operators/in.js'
import $regex from './operators/regex.js'
import $size from './operators/size.js'
import $type from './operators/type.js'

/**
 * Generates a new variable name and update the context counter
 */
function getVarName (context) {
  return `v${context.index++}`
}

/**
 * Update current context variable (scope)
 */
function setVariable (context, variable) {
  return {
    ...context,
    variable
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
 * @param {Function} fn Matching function to apply to any targeted value.
 * @returns {Boolean}
 */
function match (value, path, fn) {
  if (value === undefined || path.length <= 0) {
    return fn(value)
  }

  if (match(Object(value)[path[0]], path.slice(1), fn)) {
    return true
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (match(item, path, fn)) {
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
  if (!Array.isArray(values)) {
    throw new TypeError()
  } else if (values.length > 1) {
    return values.map(value => `(${value})`).join(` ${or ? '||' : '&&'} `)
  } else if (values.length === 1) {
    return values[0]
  } else {
    throw new Error()
  }
}

function $and (context, values) {
  if (!Array.isArray(values)) {
    throw new TypeError()
  }
  return concat(
    values.map(value => compileQuery(context, value))
  )
}

function $or (context, values) {
  if (!Array.isArray(values)) {
    throw new TypeError()
  }
  return concat(
    values.map(value => compileQuery(context, value)),
    true
  )
}

function $not (code) {
  return `!(${code})`
}

function $elemMatch (context, query) {
  const varArray = context.variable
  const varItem = getVarName(context)
  const code = compileQuery(setVariable(context, varItem), query)
  return `Array.isArray(${varArray}) && !!${varArray}.find(${varItem} => ${code})`
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
    case '$in':
      return $in(variable, value)
    case '$ne':
      return $not($eq(variable, value))
    case '$nin':
      return $not($in(variable, value))
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

function compileQuery (context, query) {
  if (!isObjectLike(query)) {
    throw new TypeError()
  }

  const varDocument = context.variable

  return concat(
    Object.keys(query)
      .map(key => {
        const value = query[key]

        const path = key.split('.')

        const varPath = getVarName(context)

        const ctxCallback = setVariable(context, varPath)

        let code
        if (key === '$and') {
          code = $and(ctxCallback, value)
        } else if (key === '$nor') {
          code = $not($or(ctxCallback, value))
        } else if (key === '$or') {
          code = $or(ctxCallback, value)
        } else if (isObjectLike(value)) {
          code = compileExpression(ctxCallback, value)
        } else {
          code = $eq(varPath, value)
        }

        return `match(${varDocument}, ${JSON.stringify(path)}, ${varPath} => ${code})`
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
