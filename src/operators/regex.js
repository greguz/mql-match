import $eq from './eq.js'

export default function $regex (variable, value, options) {
  if (value instanceof RegExp) {
    if (options) {
      throw new Error('Native RegExp options assignment not supported')
    }
    return $eq(variable, value)
  } else if (typeof value === 'string') {
    return $eq(variable, new RegExp(value, options))
  } else {
    throw new TypeError('Unexpected $regex value')
  }
}
