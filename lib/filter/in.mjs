import { $eq } from './eq.mjs'
import { $or } from './logic.mjs'

export function $in (spec) {
  if (!Array.isArray(spec)) {
    throw new TypeError('Inclusion value must be an array')
  }
  return $or(spec.map($eq))
}
