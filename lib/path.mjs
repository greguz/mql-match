export function parsePath (value) {
  if (typeof value !== 'string') {
    throw new TypeError('Field path must be a string')
  } else {
    return value.split('.').map(pathPathSection)
  }
}

/**
 * Returns `true` when value is a valid property key identifier for a MQL expression.
 */
export function isIdentifier (value) {
  return typeof value === 'string' && /^[a-z0-9_ ]*$/i.test(value)
}

function pathPathSection (value) {
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value)
  } else if (isIdentifier(value)) {
    return value
  } else {
    throw new Error(`Found an invalid path segment: ${value}`)
  }
}

export function compileReader (key) {
  const identifier = 'document'
  const path = parsePath(key)

  let body = ''
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const previous = path.slice(0, i)
    if (Number.isInteger(key)) {
      body += _checkIndex(identifier, previous, key)
    } else {
      body += _checkProperty(identifier, previous, key)
    }
  }
  body += `\nreturn ${_member(identifier, path)}\n`

  return compile(body, identifier)
}

export function compileWriter (key) {
  const identifier = 'document'
  const path = parsePath(key)

  let body = ''
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const last = i === (path.length - 1)
    const previous = path.slice(0, i)
    if (Number.isInteger(key)) {
      body += last
        ? _setIndex(identifier, previous, key)
        : _ensureIndex(identifier, previous, key)
    } else {
      body += last
        ? _setProperty(identifier, previous, key)
        : _ensureProperty(identifier, previous, key)
    }
  }

  return compile(body, identifier, 'value')
}

export function compileDeleter (key) {
  const identifier = 'document'
  const path = Array.isArray(key) ? key : parsePath(key)

  let body = ''
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const last = i === (path.length - 1)
    const previous = path.slice(0, i)
    if (Number.isInteger(key)) {
      body += last
        ? _deleteIndex(identifier, previous, key)
        : _checkIndex(identifier, previous, key)
    } else {
      body += last
        ? _deleteProperty(identifier, previous, key)
        : _checkProperty(identifier, previous, key)
    }
  }

  return compile(body, identifier)
}

function _checkProperty (identifier, path, property) {
  const _parent = _member(identifier, path)
  return `
    if (${_not(_isPlainObject(_parent))}) {
      return
    }
  `
}

function _checkIndex (identifier, path, index) {
  const _parent = _member(identifier, path)
  return `
    if (${_isArray(_parent)}) {
      if (${_parent}.length <= ${index}) {
        return
      }
    } else if (${_not(_isPlainObject(_parent))}) {
      return
    }
  `
}

function _deleteProperty (identifier, path, property) {
  const _parent = _member(identifier, path)
  const _subject = _member(identifier, [...path, property])
  return `
    if (${_isPlainObject(_parent)}) {
      delete ${_subject}
    }
  `
}

function _deleteIndex (identifier, path, index) {
  const _parent = _member(identifier, path)
  const _subject = _member(identifier, [...path, index])
  return `
    if (${_isArray(_parent)}) {
      if (${_parent}.length >= ${index + 1}) {
        ${_subject} = null
      }
    } else if (${_isPlainObject(_parent)}) {
      delete ${_subject}
    }
  `
}

function _setProperty (identifier, path, property) {
  const _parent = _member(identifier, path)
  const _subject = _member(identifier, [...path, property])
  return `
    if (${_not(_isPlainObject(_parent))}) {
      ${_throw(`Cannot set ${_subject} member`)}
    }
    ${_subject} = value
  `
}

function _ensureProperty (identifier, path, property) {
  const _parent = _member(identifier, path)
  const _subject = _member(identifier, [...path, property])
  return `
    if (${_not(_isPlainObject(_parent))}) {
      ${_throw(`Cannot access ${_subject} member`)}
    } else if (${_subject} === undefined) {
      ${_subject} = {}
    }
  `
}

function _setIndex (identifier, path, index) {
  const _parent = _member(identifier, path)
  const _subject = _member(identifier, [...path, index])
  return `
    if (${_isArray(_parent)}) {
      while (${_parent}.length <= ${index}) {
        ${_parent}.push(null)
      }
    } else if (${_not(_isPlainObject(_parent))}) {
      ${_throw(`Cannot set ${_subject} member`)}
    }
    ${_subject} = value
  `
}

function _ensureIndex (identifier, path, index) {
  const _parent = _member(identifier, path)
  const _subject = _member(identifier, [...path, index])
  return `
    if (${_isArray(_parent)}) {
      while (${_parent}.length < ${index}) {
        ${_parent}.push(null)
      }
      if (${_parent}.length === ${index}) {
        ${_parent}.push({})
      }
    } else if (${_isPlainObject(_parent)}) {
      if (${_subject} === undefined) {
        ${_subject} = {}
      }
    } else {
      ${_throw(`Cannot access ${_subject} member`)}
    }
  `
}

/**
 * Compile a function with a sane arguments order :)
 */
function compile (body, ...names) {
  // eslint-disable-next-line
  return new Function(...names, body)
}

function _member (identifier, path) {
  let txt = identifier
  for (const key of path) {
    if (typeof key === 'number') {
      txt += `[${key}]`
    } else if (/^[a-z_][a-z0-9_]*$/i.test(key)) {
      txt += `.${key}`
    } else {
      txt += `[${JSON.stringify(key)}]`
    }
  }
  return txt
}

function _isArray (identifier) {
  return `Array.isArray(${identifier})`
}

function _isPlainObject (identifier) {
  return `typeof ${identifier} === 'object' && ${identifier} !== null && Object.getPrototypeOf(${identifier}) === Object.prototype`
}

function _not (code) {
  return `!(${code})`
}

function _throw (message = '') {
  // TODO: use MqlError class
  return `throw new Error(${JSON.stringify(message)})`
}
