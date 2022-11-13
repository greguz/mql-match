import { compileReader, compileWriter, parsePath } from './path.mjs'
import {
  isArray,
  isDate,
  isNull,
  isNullish,
  isNumber,
  isObjectId,
  isOperatorExpression,
  isPlainObject,
  isUndefined
} from './util.mjs'

export function compileAggregationExpression (expression) {
  const map = compileExpression(expression, true)
  return doc => {
    const ctx = { root: doc }
    return map(doc, ctx)
  }
}

function compileExpression (expression, isRoot) {
  if (isNullish(expression)) {
    return () => null
  } else if (typeof expression === 'string' && /^\$[a-z_][a-z0-9_]*$/i.test(expression)) {
    return compileReader(expression.substring(1))
  } else if (expression === '$$NOW') {
    return () => new Date()
  } else if (expression === '$$ROOT') {
    return (doc, ctx) => ctx.root
  } else if (isOperatorExpression(expression)) {
    return compileOperatorExpression(expression)
  } else if (isPlainObject(expression)) {
    return compileObjectExpression(expression, isRoot)
  } else if (isSafePrimitive(expression)) {
    return () => expression
  } else {
    throw new Error(`Unsupported aggregation expression: ${expression}`)
  }
}

function isSafePrimitive (value) {
  return isNull(value) ||
    isNumber(value) ||
    isObjectId(value) ||
    isDate(value) ||
    ['bigint', 'boolean', 'number', 'string'].includes(typeof value)
}

const operators = {
  $abs,
  $add,
  $ceil,
  $literal,
  $subtract
}

function compileOperatorExpression (expression) {
  const key = Object.keys(expression)[0]
  const value = expression[key]
  const fn = operators[key]
  if (!fn) {
    throw new Error(`Unsupported project operator: ${key}`)
  }
  return fn(value)
}

function compileObjectExpression (expression, isRoot = false) {
  // This will validate and simplify the expression object
  expression = parseObjectExpression(expression)

  const omit = []
  const pick = []
  const map = []

  let idValue

  for (const key of Object.keys(expression)) {
    const value = expression[key]

    if (key === '_id' && isRoot) {
      idValue = value
    } else if (value === 0 || value === false) {
      omit.push(key)
    } else if (value === 1 || value === true) {
      pick.push(key)
    } else {
      map.push(compileFieldValue(key, value))
    }
  }

  if (omit.length > 0 && pick.length > 0) {
    throw new Error('Projection mode mix')
  }

  if (isRoot) {
    if (omit.length > 0) {
      if (idValue === 0 || idValue === false) {
        omit.push('_id')
      } else if (!isUndefined(idValue) && idValue !== 1 && idValue !== true) {
        map.push(compileFieldValue('_id', idValue))
      }
    } else if (pick.length > 0) {
      if (isUndefined(idValue) || idValue === 1 || idValue === true) {
        pick.push('_id')
      } else if (idValue !== 0 && idValue !== false) {
        map.push(compileFieldValue('_id', idValue))
      }
    } else if (idValue === 0 || idValue === false) {
      omit.push('_id')
    } else if (idValue === 1 || idValue === true) {
      pick.push('_id')
    } else if (!isUndefined(idValue)) {
      map.push(compileFieldValue('_id', idValue))
    } else if (map.length > 0) {
      pick.push('_id')
    }
  }

  let project
  if (omit.length > 0) {
    project = compileOmitter(omit)
  } else if (pick.length > 0) {
    project = compilePicker(pick)
  }

  return (doc, ctx) => {
    const result = applyProjection(doc, project)
    for (const fn of map) {
      fn(result, doc, ctx)
    }
    return result
  }
}

function applyProjection (value, project) {
  if (isArray(value)) {
    return value.map(item => applyProjection(item, project))
  } else if (isPlainObject(value)) {
    return project ? project({ ...value }) : { ...value }
  } else {
    return value
  }
}

function parseObjectExpression (expression) {
  const keys = Object.keys(expression)
  if (!keys.length) {
    throw new Error('Expression objects expects at least one field')
  }

  const result = {}

  for (const key of keys) {
    const path = parsePath(key)
    const value = expression[key]

    if (value === 0 || value === 1 || typeof value === 'boolean') {
      let subject = result
      for (let i = 0; i < path.length; i++) {
        const chunk = path[i]

        if (i === path.length - 1) {
          subject[chunk] = value
        } else {
          if (subject[chunk] === undefined) {
            subject[chunk] = {}
          } else if (!isPlainObject(subject[chunk])) {
            throw new Error(`Path collision at ${key}`)
          }
          subject = subject[chunk]
        }
      }
    } else {
      result[key] = value
    }
  }

  return result
}

function compileFieldValue (key, expression) {
  const map = compileExpression(expression)
  const read = compileReader(key)
  const write = compileWriter(key)
  return (result, doc, ctx) => {
    write(result, map(read(doc), ctx))
  }
}

function compileOmitter (items) {
  return doc => {
    const result = {}
    for (const key of Object.keys(doc)) {
      if (!items.includes(key)) {
        result[key] = doc[key]
      }
    }
    return result
  }
}

function compilePicker (items) {
  return doc => {
    const result = {}
    for (const key of Object.keys(doc)) {
      if (items.includes(key)) {
        result[key] = doc[key]
      }
    }
    return result
  }
}

function $abs (expression) {
  const map = compileExpression(expression)
  return (doc, ctx) => {
    const value = map(ctx.root, ctx)
    if (isNullish(value)) {
      return null
    } else if (isNumber(value)) {
      return Math.abs(value)
    } else {
      return NaN
    }
  }
}

function $add (expressions) {
  if (!isArray(expressions)) {
    throw new TypeError('Operator $add expects an array of expressions')
  }
  const fns = expressions.map(compileExpression)
  return (doc, ctx) => {
    const values = fns.map(fn => fn(ctx.root, ctx))
    let result = 0
    for (const value of values) {
      if (isDate(value)) {
        result += value.getTime()
      } else if (isNumber(value)) {
        result += value
      } else {
        throw new TypeError('Operator $add expects a number or a date')
      }
    }
    if (values.length >= 1 && isDate(values[0])) {
      result = new Date(result)
    }
    return result
  }
}

function $ceil (expression) {
  const map = compileExpression(expression)
  return (doc, ctx) => {
    const value = map(ctx.root, ctx)
    if (isUndefined(value) || isNull(value)) {
      return null
    } else if (isNumber(value)) {
      return Math.ceil(value)
    } else {
      return NaN
    }
  }
}

function $literal (value) {
  // TODO: validate?
  return () => value
}

function $subtract (expressions) {
  if (!isArray(expressions)) {
    throw new TypeError('Operator $subtract expects an array of expressions')
  }
  const fns = expressions.map(compileExpression)
  return (doc, ctx) => {
    const values = fns.map(fn => fn(ctx.root, ctx))
    let result
    for (const value of values) {
      if (isDate(value)) {
        if (isUndefined(result)) {
          result = value.getTime()
        } else {
          result -= value.getTime()
        }
      } else if (isNumber(value)) {
        if (isUndefined(result)) {
          result = value
        } else {
          result -= value
        }
      } else {
        throw new TypeError('Operator $add expects a number or a date')
      }
    }
    if (values.length >= 1 && isDate(values[0])) {
      result = new Date(result)
    }
    return result
  }
}
