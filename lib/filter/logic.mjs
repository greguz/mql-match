import { isArray, isFunction, no, yes } from '../util.mjs'

export function $and (spec) {
  if (!isArray(spec)) {
    throw new TypeError()
  }
  if (spec.length < 1) {
    return yes
  }
  for (const fn of spec) {
    if (!isFunction(fn)) {
      throw new TypeError()
    }
  }
  if (spec.length === 1) {
    return spec[0]
  }
  return value => {
    for (const fn of spec) {
      if (!fn(value)) {
        return false
      }
    }
    return true
  }
}

export function $or (spec) {
  if (!isArray(spec)) {
    throw new TypeError()
  }
  if (spec.length < 1) {
    return no
  }
  for (const fn of spec) {
    if (!isFunction(fn)) {
      throw new TypeError()
    }
  }
  if (spec.length === 1) {
    return spec[0]
  }
  return value => {
    for (const fn of spec) {
      if (fn(value)) {
        return true
      }
    }
    return false
  }
}

export function $not (spec) {
  if (!isFunction(spec)) {
    throw new TypeError()
  }
  return value => !spec(value)
}

export function $nor (spec) {
  return $not($or(spec))
}
