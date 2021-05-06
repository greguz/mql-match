const primitives = ['boolean', 'number', 'string']

function callMethod (variable, method) {
  return `typeof Object(${variable}).${method} === 'function' ? ${variable}.${method}() : null`
}

function toHexString (value) {
  const id = value.toHexString()
  if (!/^[a-f0-9]{24}$/.test(id)) {
    throw new Error('Unexpected ObjectId value')
  }
  return JSON.stringify(id)
}

function toISOString (value) {
  const date = value.toISOString()
  if (!/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z$/.test(date)) {
    throw new Error('Unexpected date value')
  }
  return JSON.stringify(date)
}

function compile (variable, value, negated) {
  const opertator = negated ? '!==' : '==='

  if (value === undefined) {
    throw new TypeError('Undefined equality not supported')
  } else if (value === null) {
    return negated
      ? `${variable} !== null && ${variable} !== undefined`
      : `${variable} === null || ${variable} === undefined`
  } else if (value instanceof Date) {
    return `(${callMethod(variable, 'toISOString')}) === ${toISOString(value)}`
  } else if (typeof value.toHexString === 'function') {
    return `(${callMethod(variable, 'toHexString')}) === ${toHexString(value)}`
  } else if (typeof value === 'bigint') {
    return `${variable} ${opertator} ${value.toString()}n`
  } else if (primitives.includes(typeof value)) {
    return `${variable} ${opertator} ${JSON.stringify(value)}`
  } else if (value instanceof RegExp) {
    const regexp = `new RegExp(${JSON.stringify(value.source)}, ${JSON.stringify(value.flags)})`
    return negated
      ? `typeof ${variable} !== 'string' || !${regexp}.test(${variable})`
      : `typeof ${variable} === 'string' && ${regexp}.test(${variable})`
  } else {
    throw new Error('Unsupported equality query')
  }
}

export function $eq (variable, value) {
  return compile(variable, value, false)
}

export function $ne (variable, value) {
  return compile(variable, value, true)
}
