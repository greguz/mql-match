import { getBSONType } from '../bson.mjs'
import {
  compileEq,
  compileGt,
  compileGte,
  compileLt,
  compileLte,
  compileType
} from '../comparison.mjs'

export { compileEq as $eq }

export function $gt (right) {
  const sameType = compileType(getBSONType(right))
  const greaterThan = compileGt(right)
  return left => sameType(left) && greaterThan(left)
}

export function $gte (right) {
  const sameType = compileType(getBSONType(right))
  const greaterOrEqual = compileGte(right)
  return left => sameType(left) && greaterOrEqual(left)
}

export function $lt (right) {
  const sameType = compileType(getBSONType(right))
  const lesserThan = compileLt(right)
  return left => sameType(left) && lesserThan(left)
}

export function $lte (right) {
  const sameType = compileType(getBSONType(right))
  const lesserOrEqual = compileLte(right)
  return left => sameType(left) && lesserOrEqual(left)
}
