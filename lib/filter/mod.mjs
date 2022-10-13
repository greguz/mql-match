import { isArray, isNumber } from '../util.mjs'

export function $mod (spec) {
  if (!isArray(spec)) {
    throw new TypeError()
  }
  if (spec.length !== 2) {
    throw new Error()
  }

  const divider = spec[0]
  if (!isNumber(divider)) {
    throw new TypeError()
  }

  const result = spec[1]
  if (!isNumber(result)) {
    throw new TypeError()
  }

  return value => isNumber(value) && value % divider === result
}
