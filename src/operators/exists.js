export function $exists (variable, exists) {
  if (typeof exists !== 'boolean') {
    throw new TypeError('Equality value must be boolean')
  }
  return `${variable} ${exists ? '!==' : '==='} undefined`
}
