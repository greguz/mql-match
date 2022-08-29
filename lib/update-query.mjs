import {
  _compile,
  _if,
  _isArray,
  _isNotObjectLike,
  _isNullish,
  _thrown,
  _while
} from './code.mjs'
import { compileSubject, createSubject } from './subject.mjs'
import { isObjectLike } from './utils.mjs'

import { $inc } from './operators/inc.mjs'
import { $set } from './operators/set.mjs'
import { $unset } from './operators/unset.mjs'

function writePath (variable, path, callback) {
  let code = ''

  for (let i = 1; i <= path.length; i++) {
    const subject = createSubject(variable, path.slice(0, i))
    const target = compileSubject(subject)
    code += '\n'
    if (i < path.length) {
      code += _if(
        {
          condition: _isNullish(target),
          code: `${target} = {};`
        },
        {
          condition: _isArray(target),
          code: /^\d+$/.test(path[i])
            ? _while(`${target}.length <= ${parseInt(path[i], 10)}`, `${target}.push(null)`)
            : _thrown(`Unexpected array at ${target}`)
        },
        {
          condition: _isNotObjectLike(target),
          code: _thrown(`Expected object at ${target}`)
        }
      )
    } else {
      code += callback(subject)
    }
  }

  return code
}

function compileObjectExpression (variable, expression, callback) {
  if (!isObjectLike(expression)) {
    throw new Error('Expected update object definition')
  }

  return Object.keys(expression)
    .map(
      key => writePath(
        variable,
        key.split('.'),
        subject => callback(subject, expression[key])
      )
    )
    .join('\n')
}

function compileOperator (variable, key, value) {
  switch (key) {
    case '$inc':
      return compileObjectExpression(variable, value, $inc)
    case '$set':
      return compileObjectExpression(variable, value, $set)
    case '$unset':
      return compileObjectExpression(variable, value, $unset)
    default:
      throw new Error(`Unsupported operator ${key}`)
  }
}

export function compileUpdateQuery (query) {
  if (!isObjectLike(query)) {
    throw new Error('Expected update query object')
  }

  const variable = 'document'

  const blocks = Object.keys(query).map(
    key => compileOperator(variable, key, query[key])
  )

  blocks.unshift(
    _if({
      condition: _isNotObjectLike(variable),
      code: _thrown(`Expected object at ${variable}`)
    })
  )

  blocks.push(`return ${variable};`)

  return _compile({
    arguments: [variable],
    body: blocks.join('\n')
  })
}
