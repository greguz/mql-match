export const isArray = Array.isArray

export const isBoolean = value => typeof value === 'boolean'

export const isDate = value => value instanceof Date

export const isFunction = value => typeof value === 'function'

export const isInfinity = value => value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY

export const isInteger = Number.isInteger

export const isNaN = Number.isNaN

export const isNull = value => value === null

export const isNullish = value => isNull(value) || isUndefined(value)

/**
 * Finite numbers that can be used for calculations.
 * Both BigInt and primitive numbers are valid.
 */
export const isNumber = value => typeof value === 'bigint' || Number.isFinite(value)

/**
 * Detects an object-like with the `toHexString` method.
 * Avoid `instanceof` because can be present multiple version of the `ObjectId` class.
 */
export const isObjectId = value => typeof Object(value).toHexString === 'function'

export const isObjectLike = value => typeof value === 'object' && value !== null

export const isPlainObject = value => isObjectLike(value) && Object.getPrototypeOf(value) === Object.prototype

export const isRegExp = value => value instanceof RegExp

export const isString = value => typeof value === 'string'

export const isUndefined = value => value === undefined

/**
 * Detects 0, -0, 0n, -0n (and other JavaScript craziness).
 */
export const isZero = value => isNumber(value) && `${value}` === '0'

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
