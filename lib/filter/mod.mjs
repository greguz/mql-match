import { isArray, isNumber } from '../util.mjs'

export function $mod (spec) {
  if (!isArray(spec)) {
    throw new TypeError('Operator $mod expects an array')
  }
  if (spec.length !== 2) {
    throw new Error('Operator $mod expects an array with two values')
  }

  const divider = spec[0]
  if (!isNumber(divider)) {
    throw new TypeError('Operator $mod expects a valid divider')
  }

  const result = spec[1]
  if (!isNumber(result)) {
    throw new TypeError('Operator $mod expects a valid result')
  }

  return value => isNumber(value) && value % divider === result
}
