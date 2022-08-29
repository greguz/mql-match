export function createSubject (variable, path = []) {
  return {
    variable,
    path
  }
}

export function compileSubject ({ variable, path }) {
  return variable + path.map(escapePropertyName).join('')
}

export function getParentSubject ({ variable, path }) {
  if (path.length < 1) {
    throw new Error()
  }
  return createSubject(variable, path.slice(0, path.length - 1))
}

export function getAccessingProperty ({ path }) {
  if (path.length < 1) {
    throw new Error()
  }
  return path[path.length - 1]
}

function escapePropertyName (property) {
  if (/^\d+$/.test(property)) {
    return `[${property}]`
  } else if (/^[_A-Za-z][_0-9A-Za-z]*$/.test(property)) {
    return `.${property}`
  } else {
    return `[${JSON.stringify(property)}]`
  }
}
