import { compileEq } from '../comparison.mjs'
import { or } from '../util.mjs'

export function $in (spec) {
  if (!Array.isArray(spec)) {
    throw new TypeError('Inclusion value must be an array')
  }
  return or(spec.map(compileEq))
}
