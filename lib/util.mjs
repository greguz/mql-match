export const isArray = Array.isArray

export const isBigInt = value => typeof value === 'bigint'

export const isBoolean = value => typeof value === 'boolean'

export const isDate = value => value instanceof Date

export const isFunction = value => typeof value === 'function'

export const isInteger = Number.isInteger

export const isNull = value => value === null

export const isNumber = Number.isFinite

export const isObjectId = value => typeof Object(value).toHexString === 'function'

export const isObjectLike = value => typeof value === 'object' && value !== null

export const isPlainObject = value => isObjectLike(value) && Object.getPrototypeOf(value) === Object.prototype

export const isRegExp = value => value instanceof RegExp

export const isSymbol = value => typeof value === 'symbol'

export const isString = value => typeof value === 'string'

export const isUndefined = value => value === undefined

export const yes = () => true

export const no = () => false
