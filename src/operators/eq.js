const primitives = ['boolean', 'number', 'string']

function valueMethod (variable, method) {
  return `typeof Object(${variable}).${method} === 'function' ? ${variable}.${method}() : null`
}

/**
 * Generates code for MongoDB's "$eq" operator
 * @param {String} variable Variable to check.
 * @param {*} value Value to match.
 * @returns {String}
 */
export default function $eq (variable, value) {
  if (value === undefined) {
    throw new TypeError('Undefined equality not supported')
  } else if (value === null) {
    return `${variable} === null || ${variable} === undefined`
  } else if (value instanceof Date) {
    return `(${valueMethod(variable, 'toISOString')}) === '${value.toISOString()}'`
  } else if (typeof value.toHexString === 'function') {
    return `(${valueMethod(variable, 'toHexString')}) === '${value.toHexString()}'`
  } else if (typeof value === 'bigint') {
    return `${variable} === ${value.toString()}n`
  } else if (primitives.includes(typeof value)) {
    return `${variable} === ${JSON.stringify(value)}`
  } else if (value instanceof RegExp) {
    return `typeof ${variable} === 'string' && ${value.toString()}.test(${variable})`
  } else {
    throw new Error('Unsupported equality query')
  }
}
