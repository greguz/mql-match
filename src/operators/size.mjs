export function $size (variable, size) {
  if (!Number.isInteger(size) || size < 0) {
    throw new TypeError('Invalid array size')
  }
  return `Array.isArray(${variable}) && ${variable}.length === ${size}`
}
