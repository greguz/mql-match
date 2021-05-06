import { $eq, $ne } from './eq.js'

function compile (variable, values, negated) {
  if (!Array.isArray(values)) {
    throw new TypeError('Inclusion value must be an array')
  }
  if (values.length <= 0) {
    throw new Error('Inclusion operator must have at least one value')
  }
  if (values.length === 1) {
    return negated
      ? $ne(variable, values[0])
      : $eq(variable, values[0])
  }
  return values
    .map(value => `(${negated ? $ne(variable, value) : $eq(variable, value)})`)
    .join(negated ? ' && ' : ' || ')
}

export function $in (variable, values) {
  return compile(variable, values, false)
}

export function $nin (variable, values) {
  return compile(variable, values, true)
}
