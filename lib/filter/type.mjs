import { compileType } from '../comparison.mjs'
import { isArray, or } from '../util.mjs'

export function $type (spec) {
  return isArray(spec)
    ? or(spec.map(compileType))
    : compileType(spec)
}
