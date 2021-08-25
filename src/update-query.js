import {
  _if,
  _isArray,
  _isNotObjectLike,
  _isNullish,
  _thrown,
  _while
} from './code.js'
import { isObjectLike } from './utils.js'

import { $inc } from './operators/inc.js'
import { $set } from './operators/set.js'

function escapePropertyName (property) {
  if (/^\d+$/.test(property)) {
    return `[${property}]`
  } else if (/^[-_A-Za-z][-_0-9A-Za-z]*$/.test(property)) {
    return `.${property}`
  } else {
    return `[${JSON.stringify(property)}]`
  }
}

function writePath (variable, path, callback) {
  let code = _if({
    condition: _isNotObjectLike(variable),
    code: _thrown(`Expected object at ${variable}`)
  })

  for (let i = 1; i <= path.length; i++) {
    const target = variable + path.slice(0, i).map(escapePropertyName).join('')
    code += ' '
    if (i < path.length) {
      code += _if(
        {
          condition: _isNullish(target),
          code: `${target} = {}`
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
      code += callback(target)
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
        target => callback(target, expression[key])
      )
    )
    .join(' ')
}

export function compileUpdateQuery (query) {
  if (!isObjectLike(query)) {
    throw new Error('Expected update query object')
  }

  const variable = 'document'

  let code = ''
  for (const operator of Object.keys(query)) {
    code += ' '
    switch (operator) {
      case '$inc':
        code += compileObjectExpression(variable, query.$inc, $inc)
        break
      case '$set':
        code += compileObjectExpression(variable, query.$set, $set)
        break
      default:
        throw new Error(`Unsupported operator ${operator}`)
    }
  }
  code += `; return ${variable};`

  return new Function(variable, code)
}
