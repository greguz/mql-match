function compile (variable, value, operator) {
  if (Number.isFinite(value)) {
    return `Number.isFinite(${variable}) && ${variable} ${operator} ${value}`
  } else if (value instanceof Date) {
    return `${variable} instanceof Date ? ${variable}.getTime() ${operator} ${value.getTime()} : false`
  } else if (typeof value === 'string') {
    return `typeof ${variable} === "string" && ${variable} ${operator} ${JSON.stringify(value)}`
  } else {
    throw new Error('Unsupported comparison value')
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
