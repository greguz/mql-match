import { $eq } from './eq.mjs'

function valueCheck (variable, value) {
  return `${variable}.findIndex(_item => ${$eq('_item', value)}) >= 0`
}

export function $all (variable, values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Expected array')
  }
  if (values.length <= 0) {
    throw new Error('Expected array with at least one value')
  }

  const code = values.length === 1
    ? valueCheck(variable, values[0])
    : values.map(value => `(${valueCheck(variable, value)})`).join(' && ')

  return `Array.isArray(${variable}) && ${code}`
}
