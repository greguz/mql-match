function validate (value) {
  if (!Number.isFinite(value)) {
    throw new TypeError('Expected finite number')
  }
  return value
}

export function $mod (variable, value) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new TypeError('Expected array of two elements for modulo operator')
  }
  const divider = validate(value[0])
  const result = validate(value[1])
  return `Number.isFinite(${variable}) && ${variable} % ${divider} === ${result}`
}
