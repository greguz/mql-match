export function _and (conditions) {
  if (conditions.length > 1) {
    return conditions.map(item => `(${item})`).join(' && ')
  } else if (conditions.length === 1) {
    return conditions[0]
  } else {
    throw new Error('Needs at least one condition')
  }
}

export function _or (conditions) {
  if (conditions.length > 1) {
    return conditions.map(item => `(${item})`).join(' || ')
  } else if (conditions.length === 1) {
    return conditions[0]
  } else {
    throw new Error('Needs at least one condition')
  }
}

export function _not (condition) {
  return `!(${condition})`
}

export function _if (...items) {
  if (items.length <= 0) {
    throw new Error('Needs at least one conditional block')
  }
  let code = `if (${items[0].condition}) { ${items[0].code} }`
  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    if (i < items.length - 1 || item.condition) {
      code += ` else if (${item.condition}) { ${item.code} }`
    } else {
      code += ` else { ${item.code} }`
    }
  }
  return code
}

export function _thrown (message) {
  return `throw new Error(${JSON.stringify(message)})`
}

export function _isUndefined (variable) {
  return `${variable} === undefined`
}

export function _isNull (variable) {
  return `${variable} === null`
}

export function _isNullish (variable) {
  return `${_isUndefined(variable)} || ${_isNull(variable)}`
}

export function _isNotObjectLike (variable) {
  return `typeof ${variable} !== "object" || ${variable} === null`
}

export function _isObjectLike (variable) {
  return `typeof ${variable} === "object" && ${variable} !== null`
}

export function _isArray (variable) {
  return `Array.isArray(${variable})`
}

export function _while (condition, code) {
  return `while (${condition}) { ${code} }`
}
