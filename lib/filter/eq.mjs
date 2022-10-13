import {
  isArray,
  isBigInt,
  isBoolean,
  isDate,
  isNull,
  isNumber,
  isObjectId,
  isObjectLike,
  isPlainObject,
  isString,
  isUndefined
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
  } else if (isBigInt(spec)) {
    return value => (isNumber(value) ? BigInt(value) : value) === spec
  } else if (isBoolean(spec)) {
    return value => value === spec
  } else if (isDate(spec)) {
    const iso = spec.toISOString()
    return value => isDate(value) ? value.toISOString() === iso : false
  } else if (isNull(spec)) {
    return isNull
  } else if (isNumber(spec)) {
    return value => value === spec
  } else if (isObjectId(spec)) {
    const id = spec.toHexString()
    return value => isObjectId(value) ? value.toHexString() === id : false
  } else if (isObjectLike(spec)) {
    const checkProperties = $and(
      Object.keys(spec).map(key => {
        const fn = $eq(spec[key])
        return value => fn(value[key])
      })
    )
    return value => isPlainObject(value) && checkProperties(value)
  } else if (isString(spec)) {
    return value => value === spec
  } else if (isUndefined(spec)) {
    return isUndefined
  } else {
    throw new TypeError('Unsupported equality type')
  }
}
