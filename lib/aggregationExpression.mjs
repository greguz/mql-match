import { Timestamp } from 'bson'

import {
  isBinary,
  isJavaScript,
  isMaxKey,
  isMinKey,
  isNumber,
  isObjectId,
  isReference,
  isRegExp,
  isSymbol,
  isTimestamp
} from './bson.mjs'
import {
  compileReader,
  compileWriter,
  parsePath
} from './path.mjs'
import {
  isArray,
  isBoolean,
  isDate,
  isNullish,
  isObjectLike,
  isOperatorExpression,
  isPlainObject,
  isString,
  isUndefined
} from './util.mjs'

import {
  $abs,
  $add,
  $ceil,
  $divide,
  $exp,
  $floor,
  $ln,
  $log,
  $log10,
  $mod,
  $multiply,
  $pow,
  $round,
  $sqrt,
  $subtract,
  $trunc
} from './expression/arithmetic.mjs'
import {
  $concatArrays,
  $in,
  $isArray,
  $size
} from './expression/array.mjs'
import { $and, $not, $or } from './expression/boolean.mjs'
import {
  $cmp,
  $eq,
  $gt,
  $gte,
  $lt,
  $lte,
  $ne
} from './expression/comparison.mjs'
import { $cond, $ifNull, $switch } from './expression/conditional.mjs'
import { $literal, $rand } from './expression/literal.mjs'
import {
  $toBool,
  $toDouble,
  $toObjectId,
  $toString,
  $type
} from './expression/type.mjs'

const operators = {
  $abs,
  $add,
  $and,
  $ceil,
  $cmp,
  $concatArrays,
  $cond,
  $divide,
  $eq,
  $exp,
  $floor,
  $gt,
  $gte,
  $ifNull,
  $in,
  $isArray,
  $literal,
  $ln,
  $log,
  $log10,
  $lt,
  $lte,
  $mod,
  $multiply,
  $ne,
  $not,
  $or,
  $pow,
  $rand,
  $round,
  $size,
  $sqrt,
  $subtract,
  $switch,
  $toBool,
  $toDouble,
  $toObjectId,
  $toString,
  $trunc,
  $type
}

export function compileAggregationExpression (expression) {
  const map = compileExpression(expression, true)
  return doc => map(doc, { root: doc, subject: doc })
}

function compileExpression (expression, isRoot) {
  if (isNullish(expression)) {
    return () => null
  } else if (expression === '$$CLUSTER_TIME') {
    return Timestamp.fromNumber(Date.now() / 1000)
  } else if (expression === '$$NOW') {
    return () => new Date()
  } else if (expression === '$$ROOT') {
    return (doc, ctx) => ctx.root
  } else if (
    isString(expression) &&
    expression[0] === '$' &&
    expression[1] !== '$'
  ) {
    return compileReader(expression.substring(1))
  } else if (isOperatorExpression(expression)) {
    return compileOperatorExpression(expression)
  } else if (isPlainObject(expression)) {
    return compileObjectExpression(expression, isRoot === true)
  } else if (isArray(expression)) {
    const fns = expression.map(compileExpression)
    return (doc, ctx) => fns.map(fn => fn(doc, ctx))
  } else if (isSafePrimitive(expression)) {
    return () => expression
  } else {
    throw new Error(`Unsupported aggregation expression: ${expression}`)
  }
}

function isSafePrimitive (value) {
  return isBinary(value) ||
    isBoolean(value) ||
    isDate(value) ||
    isJavaScript(value) ||
    isMaxKey(value) ||
    isMinKey(value) ||
    isNumber(value) ||
    isObjectId(value) ||
    isReference(value) ||
    isRegExp(value) ||
    isString(value) ||
    isSymbol(value) ||
    isTimestamp(value)
}

function compileOperatorExpression (expression) {
  const key = Object.keys(expression)[0]
  const fn = operators[key]
  if (!fn) {
    throw new Error(`Unsupported project operator: ${key}`)
  }
  return fn(
    getExpressionArguments(expression[key]),
    compileExpression,
    key
  )
}

function getExpressionArguments (value = []) {
  if (isArray(value)) {
    return value
  } else if (isObjectLike(value) && !Object.keys(value).length) {
    // See $rand operator
    return []
  } else {
    return [value]
  }
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
    const result = applyProjection(ctx.subject, project)
    if (isPlainObject(result)) {
      for (const fn of map) {
        fn(result, doc, ctx)
      }
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
    // Calculate the new subject (needed for projection)
    const subject = read(ctx.subject)
    // Write mapped result
    write(
      result,
      map(doc, { ...ctx, subject })
    )
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
