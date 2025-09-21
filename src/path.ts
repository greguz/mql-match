import { isArray, isNullish, isNumber, isObjectLike } from './util.js'

const REG_IDENTIFIER = /^[A-Za-z0-9_]*$/

const REG_INDEX = /^\d+$/

/**
 * Parsed MongoDB key path (like `"items.1.label"`).
 */
export type Path = Array<number | string>

export function parsePath(path: unknown): Path {
  if (typeof path !== 'string') {
    throw new TypeError(
      `MongoDB field path must be a string, got ${typeof path} (${path})`,
    )
  }

  const result: Path = []
  for (const chunk of path.split('.')) {
    if (REG_INDEX.test(chunk)) {
      result.push(Number.parseInt(chunk, 10))
    } else if (REG_IDENTIFIER.test(chunk)) {
      result.push(chunk)
    } else {
      throw new TypeError(`Unsupported field path format: ${path}`)
    }
  }

  return result
}

export function getPathValue(path: Path, subject: unknown): unknown {
  let i = 0
  for (; i < path.length && !isNullish(subject); i++) {
    subject = Object(subject)[path[i]]
  }
  if (i === path.length) {
    return subject
  }
}

export function setPathValue(
  path: Path,
  subject: unknown,
  value: unknown,
): void {
  if (!path.length) {
    throw new TypeError('Expected non-empty path')
  }

  let i = 0
  for (i; i < path.length - 1 && !isNullish(subject); i++) {
    const key = path[i]

    if (isNumber(key) && isArray(subject)) {
      while (subject.length < key) {
        subject.push(null)
      }
      if (subject.length === key) {
        subject.push({})
      }
      subject = subject[key]
    } else if (isObjectLike(subject)) {
      if (isNullish(subject[key])) {
        subject[key] = {}
      }
      subject = subject[key]
    } else {
      throw new Error()
    }
  }

  const key = path[i]
  if (isNumber(key) && isArray(subject)) {
    while (subject.length < key) {
      subject.push(null)
    }

    if (subject.length === key) {
      subject.push(value)
    } else {
      subject[key] = value
    }
  } else if (isObjectLike(subject)) {
    subject[key] = value
  } else {
    throw new Error()
  }
}

export function unsetPathValue(path: Path, subject: unknown): void {
  throw new Error('TODO: unsetValue')
}
