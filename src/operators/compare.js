import { compileDate, serializeDate } from '../date.js'

function compile (variable, value, operator) {
  if (Number.isFinite(value)) {
    return `Number.isFinite(${variable}) && ${variable} ${operator} ${value}`
  } else if (value instanceof Date) {
    return `(${serializeDate(variable)}) ${operator} ${compileDate(value)}`
  } else if (typeof value === 'string') {
    return `${variable} ${operator} ${JSON.stringify(value)}`
  } else {
    throw new Error()
  }
}

export function $lt (variable, value) {
  return compile(variable, value, '<')
}

export function $lte (variable, value) {
  return compile(variable, value, '<=')
}

export function $gt (variable, value) {
  return compile(variable, value, '>')
}

export function $gte (variable, value) {
  return compile(variable, value, '>=')
}
