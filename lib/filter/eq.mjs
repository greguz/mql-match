import {
  isArray,
  isBoolean,
  isDate,
  isNaN,
  isNullish,
  isNumber,
  isObjectId,
  isPlainObject,
  isRegExp,
  isString
} from '../util.mjs'
import { $and } from './logic.mjs'

export function $eq (spec) {
  if (isArray(spec)) {
    const checkItems = $and(
      spec.map((item, i) => {
        const fn = $eq(item)
        return value => fn(value[i])
      })
    )
    const wantedLength = spec.length
    return value => isArray(value) && value.length === wantedLength && checkItems(value)
  } else if (isNaN(spec)) {
    return isNaN
  } else if (isBoolean(spec)) {
    return value => value === spec
  } else if (isDate(spec)) {
    const iso = spec.toISOString()
    return value => isDate(value) ? value.toISOString() === iso : false
  } else if (isNullish(spec)) {
    // Treat null and undefined the same
    return isNullish
  } else if (isNumber(spec)) {
    // BigInt and primitive number support
    return value => isNumber(value) && `${value}` === `${spec}`
  } else if (isObjectId(spec)) {
    const id = spec.toHexString()
    return value => isObjectId(value) ? value.toHexString() === id : false
  } else if (isString(spec)) {
    return value => value === spec
  } else if (isRegExp(spec)) {
    return value => isRegExp(value) ? `${value}` === `${spec}` : false
  } else if (isPlainObject(spec)) {
    const checkProperties = $and(
      Object.keys(spec).map(key => {
        const fn = $eq(spec[key])
        return value => fn(value[key])
      })
    )
    return value => isPlainObject(value) && checkProperties(value)
  } else {
    throw new TypeError('Unsupported equality type')
  }
}
