export const isArray = Array.isArray

export const isBoolean = value => typeof value === 'boolean'

export const isDate = value => value instanceof Date

export const isFunction = value => typeof value === 'function'

export const isNull = value => value === null

export const isNullish = value => value === undefined || value === null

export const isObjectLike = value => typeof value === 'object' &&
  value !== null

export const isPlainObject = value => typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype

export const isString = value => typeof value === 'string'

export const isUndefined = value => value === undefined

export const isFinite = value => typeof value === 'bigint' ||
  Number.isFinite(value)

export const isInteger = value => typeof value === 'bigint' ||
  Number.isInteger(value)

export const isInfinity = value => value === Number.POSITIVE_INFINITY ||
  value === Number.NEGATIVE_INFINITY

export const yes = () => true

export const no = () => false

export function isOperatorExpression (value) {
  if (isPlainObject(value)) {
    const keys = Object.keys(value)
    return keys.length === 1 && /^\$[a-z][A-Za-z0-9]*$/.test(keys[0])
  } else {
    return false
  }
}

export async function toArray (iterable) {
  const items = []
  for await (const item of iterable) {
    items.push(item)
  }
  return items
}

export function and (fns) {
  if (!fns.length) {
    return yes
  } else if (fns.length === 1) {
    return fns[0]
  }
  return value => {
    for (const fn of fns) {
      if (!fn(value)) {
        return false
      }
    }
    return true
  }
}

export function or (fns) {
  if (!fns.length) {
    return no
  } else if (fns.length === 1) {
    return fns[0]
  }
  return value => {
    for (const fn of fns) {
      if (fn(value)) {
        return true
      }
    }
    return false
  }
}

export function not (fn) {
  return value => !fn(value)
}

export function nor (fns) {
  return not(or(fns))
}

/**
 * Bind (without context) an operator-like function.
 */
export function bind (fn, options) {
  return (args, compile, operator) => fn(options, args, compile, operator)
}
