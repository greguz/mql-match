import $eq from './eq.js'

export default function $in (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Inclusion value must be an array')
  }
  if (values.length <= 0) {
    throw new Error('Inclusion operator must have at least one value')
  }
  if (values.length === 1) {
    return $eq(variable, values[0])
  }
  return values.map(value => `(${$eq(variable, value)})`).join(' || ')
}
