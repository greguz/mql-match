const primitives = ['boolean', 'number', 'string']

function compileObjectId (value) {
  const id = value.toHexString()
  if (!/^[a-f0-9]{24}$/.test(id)) {
    throw new Error('Unexpected ObjectId value')
  }
  return JSON.stringify(id)
}

function serializeObjectId (variable) {
  return `typeof Object(${variable}).toHexString === "function" ? ${variable}.toHexString() : null`
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
    return `(${variable} instanceof Date ? ${variable}.getTime() : null) ${opertator} ${value.getTime()}`
  } else if (typeof value.toHexString === 'function') {
    return `(${serializeObjectId(variable)}) === ${compileObjectId(value)}`
  } else if (typeof value === 'bigint') {
    return `${variable} ${opertator} ${value.toString()}n`
  } else if (primitives.includes(typeof value)) {
    return `${variable} ${opertator} ${JSON.stringify(value)}`
  } else if (value instanceof RegExp) {
    const regexp = `new RegExp(${JSON.stringify(value.source)}, ${JSON.stringify(value.flags)})`
    return negated
      ? `typeof ${variable} !== "string" || !${regexp}.test(${variable})`
      : `typeof ${variable} === "string" && ${regexp}.test(${variable})`
  } else if (Array.isArray(value)) {
    let code = `Array.isArray(${variable}) && ${variable}.length === ${value.length}`
    if (value.length > 0) {
      code += ' && ' + value
        .map((item, index) => `(${compile(`${variable}[${index}]`, item)})`)
        .join(' && ')
    }
    if (negated) {
      code = `!(${code})`
    }
    return code
  } else if (typeof value === 'object') {
    const keys = Object.keys(value)
    let code = `typeof ${variable} === "object" && ${variable} !== null && Object.getPrototypeOf(${variable}) === Object.prototype && Object.keys(${variable}).length === ${keys.length}`
    if (keys.length > 0) {
      code += ' && ' + keys
        .map(key => `(${compile(`${variable}[${JSON.stringify(key)}]`, value[key])})`)
        .join(' && ')
    }
    if (negated) {
      code = `!(${code})`
    }
    return code
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
