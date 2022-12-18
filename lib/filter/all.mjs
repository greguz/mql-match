import { compileEq } from '../comparison.mjs'
import { and, isArray } from '../util.mjs'

export function $all (spec) {
  if (!Array.isArray(spec)) {
    throw new TypeError('Operator $all expects an array')
  }
  if (spec.length <= 0) {
    throw new Error('Expected array with at least one value')
  }
  const hasAllItems = and(
    spec.map(item => {
      const fn = compileEq(item)
      return value => value.findIndex(fn) >= 0
    })
  )
  return value => isArray(value) && hasAllItems(value)
}
