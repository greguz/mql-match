import { isNumber, isObjectId, n } from '../bson.mjs'
import { isDate, isString, no } from '../util.mjs'

export function $gt (spec) {
  const match = compileType(spec)
  const right = compileArgument(spec)
  return left => match(left) && mapValue(left) > right
}

export function $gte (spec) {
  const match = compileType(spec)
  const right = compileArgument(spec)
  return left => match(left) && mapValue(left) >= right
}

export function $lt (spec) {
  const match = compileType(spec)
  const right = compileArgument(spec)
  return left => match(left) && mapValue(left) < right
}

export function $lte (spec) {
  const match = compileType(spec)
  const right = compileArgument(spec)
  return left => match(left) && mapValue(left) <= right
}

function compileType (spec) {
  if (isDate(spec)) {
    return isDate
  } else if (isNumber(spec)) {
    return isNumber
  } else if (isObjectId(spec)) {
    return isObjectId
  } else if (isString(spec)) {
    return isString
  } else {
    return no
  }
}

function compileArgument (spec) {
  const value = mapValue(spec)
  if (value === null) {
    throw new Error('Comparison not supported')
  }
  return value
}

function mapValue (spec) {
  if (isDate(spec)) {
    return spec.toISOString()
  } else if (isNumber(spec)) {
    return n(spec)
  } else if (isObjectId(spec)) {
    return spec.getTimestamp()
  } else if (isString(spec)) {
    return spec
  } else {
    return null
  }
}
