import { isUndefined } from '../util.mjs'
import { $not } from './logic.mjs'

export function $exists (spec) {
  if (spec === true) {
    return $not(isUndefined)
  } else if (spec === false) {
    return isUndefined
  } else {
    throw new TypeError('Equality value must be boolean')
  }
}
