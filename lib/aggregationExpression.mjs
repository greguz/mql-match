import { compileReader, compileWriter, parsePath } from './path.mjs'
import {
  isArray,
  isBoolean,
  isDate,
  isInfinity,
  isNullish,
  isNumber,
  isObjectId,
  isOperatorExpression,
  isPlainObject,
  isRegExp,
  isString,
  isUndefined
} from './util.mjs'

import { $abs } from './expression/abs.mjs'
import { $add } from './expression/add.mjs'
import { $and } from './expression/and.mjs'
import { $ceil } from './expression/ceil.mjs'
import { $cmp, $eq, $gt, $gte, $lt, $lte, $ne } from './expression/compare.mjs'
import { $concatArrays } from './expression/concatArrays.mjs'
import { $cond } from './expression/cond.mjs'
import { $divide } from './expression/divide.mjs'
import { $exp } from './expression/exp.mjs'
import { $floor } from './expression/floor.mjs'
import { $ifNull } from './expression/ifNull.mjs'
import { $in } from './expression/in.mjs'
import { $isArray } from './expression/isArray.mjs'
import { $literal } from './expression/literal.mjs'
import { $ln, $log, $log10 } from './expression/log.mjs'
import { $mod } from './expression/mod.mjs'
import { $multiply } from './expression/multiply.mjs'
import { $not } from './expression/not.mjs'
import { $or } from './expression/or.mjs'
import { $pow } from './expression/pow.mjs'
import { $round } from './expression/round.mjs'
import { $size } from './expression/size.mjs'
import { $sqrt } from './expression/sqrt.mjs'
import { $subtract } from './expression/subtract.mjs'
import { $switch } from './expression/switch.mjs'
import { $trunc } from './expression/trunc.mjs'

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
  $round,
  $size,
  $sqrt,
  $subtract,
  $switch,
  $trunc
}

export function compileAggregationExpression (expression) {
  const map = compileExpression(expression, true)
  return doc => map(doc, { root: doc, subject: doc })
}

function compileExpression (expression, isRoot = false) {
  if (isNullish(expression)) {
    return () => null
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
    return compileObjectExpression(expression, isRoot)
  } else if (isSafePrimitive(expression)) {
    return () => expression
  } else {
    throw new Error(`Unsupported aggregation expression: ${expression}`)
  }
}

function isSafePrimitive (value) {
  return isBoolean(value) ||
    isDate(value) ||
    isInfinity(value) ||
    isNaN(value) ||
    isNumber(value) ||
    isObjectId(value) ||
    isRegExp(value) ||
    isString(value)
}

function compileOperatorExpression (expression) {
  const key = Object.keys(expression)[0]
  const value = expression[key]
  const fn = operators[key]
  if (!fn) {
    throw new Error(`Unsupported project operator: ${key}`)
  }
  return fn(value, compileExpression)
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
