import { isArray } from '../util.mjs'
import { $eq } from './eq.mjs'
import { $and } from './logic.mjs'

export function $all (spec) {
  if (!Array.isArray(spec)) {
    throw new TypeError()
  }
  if (spec.length <= 0) {
    throw new Error('Expected array with at least one value')
  }
  const hasAllItems = $and(
    spec.map(item => {
      const fn = $eq(item)
      return value => value.findIndex(fn) >= 0
    })
  )
  return value => isArray(value) && hasAllItems(value)
}
