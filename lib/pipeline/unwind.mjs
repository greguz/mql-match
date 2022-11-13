import { compileReader, isIdentifier } from '../path.mjs'
import { isArray, isNull, isPlainObject, isUndefined } from '../util.mjs'

export function $unwind (expression) {
  const options = typeof expression === 'string'
    ? { path: expression }
    : expression

  if (!isPlainObject(options)) {
    throw new TypeError('Unexpected $unwind stage options')
  }
  if (!isValidFieldPath(options.path)) {
    throw new TypeError('Expected valid $unwind path field')
  }
  if (options.includeArrayIndex !== undefined && !isIdentifier(options.includeArrayIndex)) {
    throw new TypeError('Invalid $unwind index field')
  }

  const key = options.path.substring(1)
  const read = compileReader(key)

  return async function * unwindStage (iterable) {
    for await (const document of iterable) {
      const value = read(document)

      if (isArray(value) && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i]
          const result = { ...document, [key]: item }
          if (options.includeArrayIndex) {
            result[options.includeArrayIndex] = i
          }
          yield result
        }
      } else if (options.preserveNullAndEmptyArrays === true || !isNullOrEmptyArray(value)) {
        const mapped = { ...document }
        if (isArray(value)) {
          delete mapped[key]
        }
        if (options.includeArrayIndex) {
          mapped[options.includeArrayIndex] = null
        }
        yield mapped
      }
    }
  }
}

function isValidFieldPath (value) {
  return typeof value === 'string' && value[0] === '$' && isIdentifier(value.substring(1))
}

function isEmptyArray (value) {
  return isArray(value) && value.length === 0
}

function isNullOrEmptyArray (value) {
  return isUndefined(value) || isNull(value) || isEmptyArray(value)
}
