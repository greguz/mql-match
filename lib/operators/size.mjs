import { isArray } from '../util.mjs'

export function $size (spec) {
  if (!Number.isInteger(spec)) {
    throw new TypeError()
  }
  if (spec < 0) {
    throw new Error()
  }
  return value => isArray(value) && value.length === spec
}
