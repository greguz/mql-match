import { isArray } from '../util.mjs'

export function $size (spec) {
  if (!Number.isInteger(spec) || spec < 0) {
    throw new TypeError('Operator $size accepts positive integers or zero')
  }
  return value => isArray(value) && value.length === spec
}
