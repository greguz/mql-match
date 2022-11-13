import { isString } from '../util.mjs'

export function $regex (pattern, flags) {
  const reg = compile(pattern, flags)
  return value => isString(value) && reg.test(value)
}

function compile (pattern, flags) {
  // TODO: Support custom MongoDB RegExp flags?
  if (pattern instanceof RegExp) {
    // TODO: Join flags
    return pattern
  } else if (typeof pattern === 'string') {
    // TODO: Validate flags
    return new RegExp(pattern, flags)
  } else {
    throw new Error('Unknown RegExp type')
  }
}
