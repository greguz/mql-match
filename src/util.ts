export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isBinary(value: unknown): value is Uint8Array {
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

export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
