import { $eq } from './eq.mjs'

export function $regex (variable, pattern, flags) {
  if (pattern instanceof RegExp) {
    return $eq(variable, flags ? new RegExp(pattern.source, flags) : pattern)
  } else if (typeof pattern === 'string') {
    return $eq(variable, new RegExp(pattern, flags))
  } else {
    throw new TypeError('Unexpected $regex value')
  }
}
