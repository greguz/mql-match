export function parsePath (value) {
  if (typeof value !== 'string') {
    throw new TypeError('Field path must be a string')
  } else {
    return value.split('.').map(pathPathSection)
  }
}

function pathPathSection (value) {
  if (/^[a-z_][a-z0-9_]*$/i.test(value)) {
    return value
  } else if (/^\d+$/.test(value)) {
    return parseInt(value)
  } else {
    throw new Error(`Found an invalid path segment: ${value}`)
  }
}

export function compileReader (key) {
  return compileUnaryOp(key, 'return')
}

export function compileWriter (key) {
  const identifier = 'document'
  const path = parsePath(key)

  let body = ''
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const set = i === (path.length - 1)
    const previous = path.slice(0, i)
    if (Number.isInteger(key)) {
      body += set
        ? _setIndex(identifier, previous, key)
        : _checkIndex(identifier, previous, key)
    } else {
      body += set
        ? _setProperty(identifier, previous, key)
        : _checkProperty(identifier, previous, key)
    }
  }

  return compile(body, identifier, 'value')
}

export function compileDeleter (key) {
  return compileUnaryOp(key, 'delete')
}

function compileUnaryOp (key, operator) {
  const identifier = 'document'
  const path = parsePath(key)

  const checks = [
    _isObjectLike(identifier)
  ]
  for (let i = 1; i < path.length; i++) {
    checks.push(
      _isObjectLike(
        _member(identifier, path.slice(0, i))
      )
    )
  }

  const body = checks.reverse().reduce(
    (acc, check, index) => `${tab(checks.length - index)}if (${check}) {\n${acc}${tab(checks.length - index)}}\n`,
    `${tab(checks.length + 1)}${operator} ${_member(identifier, path)}\n`
  )

  return compile(body, identifier)
}

/**
 * Compile a function with a sane arguments order :)
 */
function compile (body, ...names) {
  // eslint-disable-next-line
  return new Function(...names, body)
}

/**
 * Tabbing utility
 */
function tab (n = 0) {
  let txt = ''
  for (let i = 0; i < n; i++) {
    txt += '  '
  }
  return txt
}

function _isObjectLike (identifier) {
  return `typeof ${identifier} === "object" && ${identifier} !== null`
}

function _member (identifier, path) {
  let txt = identifier
  for (const key of path) {
    if (typeof key === 'number') {
      txt += `[${key}]`
    } else {
      txt += `.${key}`
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
  return `throw new Error(${JSON.stringify(message)})`
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

function _checkProperty (identifier, path, property) {
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

function _checkIndex (identifier, path, index) {
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
