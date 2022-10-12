import { isDate, isNumber, isObjectId, isString, no } from '../util.mjs'

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

function mapValue (spec) {
  if (isDate(spec)) {
    return spec.toISOString()
  } else if (isNumber(spec)) {
    return spec
  } else if (isObjectId(spec)) {
    return spec.getTimestamp()
  } else if (isString(spec)) {
    return spec
  } else {
    return null
  }
}

function compileArgument (spec) {
  const value = mapValue(spec)
  if (value === null) {
    throw new Error('Comparison not supported')
  }
  return value
}

export function $lt (spec) {
  const rightArg = compileArgument(spec)
  const match = compileType(spec)
  return value => match(value) && mapValue(value) < rightArg
}

export function $lte (spec) {
  const rightArg = compileArgument(spec)
  const match = compileType(spec)
  return value => match(value) && mapValue(value) <= rightArg
}

export function $gt (spec) {
  const rightArg = compileArgument(spec)
  const match = compileType(spec)
  return value => match(value) && mapValue(value) > rightArg
}

export function $gte (spec) {
  const rightArg = compileArgument(spec)
  const match = compileType(spec)
  return value => match(value) && mapValue(value) >= rightArg
}
