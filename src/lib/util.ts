export function expected<T>(value: T, message = 'Expected a value'): T & {} {
  if (value === null || value === undefined) {
    throw new TypeError(message)
  }
  return value
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isBuffer(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date
}

export function isNull(value: unknown): value is null {
  return value === null
}

export function isNullish(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value)
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

export type ObjectLike = Record<string, unknown>

export function isObjectLike(value: unknown): value is ObjectLike {
  return typeof value === 'object' && value !== null
}

export function isPlainObject(value: unknown): value is ObjectLike {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    (value as object).constructor === Object
  )
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

export function last<T>(items: T[]): T | undefined {
  if (items.length > 0) {
    return items[items.length - 1]
  }
}
