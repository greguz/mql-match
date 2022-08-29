export function isObjectId (value) {
  return typeof Object(value).toHexString === 'function'
}

export function isObjectLike (value) {
  return typeof value === 'object' && value !== null
}
