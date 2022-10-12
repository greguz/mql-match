import {
  isArray,
  isNumber,
  isObjectLike,
  isPlainObject,
  isUndefined
} from './util.mjs'

export function parsePath (value) {
  if (typeof value !== 'string') {
    throw new TypeError()
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

export function readValue (document, path, fallback) {
  let subject = document

  for (let i = 0; i < path.length && isObjectLike(subject); i++) {
    subject = subject[path[i]]
  }

  return subject === undefined ? fallback : subject
}

export function writeValue (document, path, value) {
  const chunks = [...path]
  const key = chunks.pop()

  let subject = document

  for (const chunk of chunks) {
    if (isArray(subject) && isNumber(chunk)) {
      if (isUndefined(subject[chunk])) {
        setArrayValue(subject, chunk, {})
      }
    } else if (isPlainObject(subject)) {
      if (isUndefined(subject[chunk])) {
        subject[chunk] = {}
      }
    } else {
      throw new Error()
    }

    subject = subject[chunk]
  }

  if (isArray(subject) && isNumber(key)) {
    setArrayValue(subject, key, value)
  } else if (isPlainObject(subject)) {
    subject[key] = value
  } else {
    throw new Error()
  }

  return document
}

function setArrayValue (array, index, value) {
  while (array.length <= index) {
    array.push(null)
  }
  array[index] = value
}

export function deleteValue (document, path) {
  const chunks = [...path]
  const key = chunks.pop()

  let subject = document

  for (const chunk of chunks) {
    if (isArray(subject) && isNumber(chunk)) {
      subject = subject[chunk]
    } else if (isPlainObject(subject)) {
      subject = subject[chunk]
    } else {
      subject = undefined
    }
  }

  if (isArray(subject) && isNumber(key)) {
    const length = key + 1
    if (subject.length > length) {
      subject[key] = null
    } else if (subject.length === length) {
      subject.pop()
    }
  } else if (isPlainObject(subject)) {
    delete subject[key]
  }
}
