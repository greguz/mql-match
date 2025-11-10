import { $eq } from '../expression/comparison.js'
import { assertBSON, unwrapBSON, unwrapNumber, wrapNodes } from '../lib/bson.js'
import { type BSONNode, NodeKind, nNullish } from '../lib/node.js'
import type { UpdateMapper } from '../lib/update.js'
import { expected } from '../lib/util.js'
import { evalMatch, parseMatch } from '../match.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pop/
 */
export function $pop(arg: BSONNode): UpdateMapper {
  const n = unwrapNumber(arg, `$pop expects a number (got ${arg.kind})`)
  if (n !== 1 && n !== -1) {
    throw new TypeError(`$pop expects 1 or -1 (got ${n})`)
  }

  return value => {
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$pop found an element of non-array type (got ${value.kind})`,
      )
    }

    if (n === -1) {
      expected(value.raw).shift()
      value.value.shift()
    } else {
      expected(value.raw).pop()
      value.value.pop()
    }

    return value
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pull/
 */
export function $pull(arg: BSONNode): UpdateMapper {
  const query = parseMatch(arg)

  return value => {
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$pull found an element of non-array type (got ${value.kind})`,
      )
    }

    let i = 0
    while (i < value.value.length) {
      if (evalMatch(query, value.value[i]).value) {
        expected(value.raw).splice(i, 1)
        value.value.splice(i, 1)
      } else {
        i++
      }
    }

    return value
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/
 */
export function $pullAll(arg: BSONNode): UpdateMapper {
  const blacklist = assertBSON(
    arg,
    NodeKind.ARRAY,
    '$pullAll expectes an array',
  ).value

  return value => {
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$pullAll found an element of non-array type (got ${value.kind})`,
      )
    }

    for (const item of blacklist) {
      let i = 0
      while (i < value.value.length) {
        if ($eq(value.value[i], item).value) {
          expected(value.raw).splice(i, 1)
          value.value.splice(i, 1)
        } else {
          i++
        }
      }
    }

    return value
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/push/
 *
 * Update array to add elements in the correct position.
 * Apply sort, if specified.
 * Slice the array, if specified.
 * Store the array.
 */
export function $push(arg: BSONNode): UpdateMapper {
  let $each: BSONNode[]
  let $position: number
  let $slice: number

  if (arg.kind === NodeKind.OBJECT && arg.keys.some(k => k[0] === '$')) {
    $each = parseEach(arg.value.$each)
    $position = parsePosition(arg.value.$position)
    parseSort(arg.value.$sort)
    $slice = parseSlice(arg.value.$slice)
  } else {
    $each = [arg]
    $position = parsePosition()
    parseSort()
    $slice = parseSlice()
  }

  return value => {
    if ($slice === 0) {
      return wrapNodes([])
    }
    if (value.kind === NodeKind.NULLISH) {
      return wrapNodes($each)
    }
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$push found an element of non-array type (got ${value.kind})`,
      )
    }

    // From 0 to "length"
    const i: number =
      $position < 0
        ? Math.max(0, value.value.length + $position)
        : Math.min(value.value.length, $position)

    if (i >= value.value.length) {
      expected(value.raw).push(...$each.map(unwrapBSON))
      value.value.push(...$each)
    } else {
      expected(value.raw).splice(i, 0, ...$each.map(unwrapBSON))
      value.value.splice(i, 0, ...$each)
    }

    if (Number.isFinite($slice)) {
      if ($slice >= 0) {
        const n = value.value.length
        expected(value.raw).splice($slice, n)
        value.value.splice($slice, n)
      } else {
        const n = value.value.length + $slice
        expected(value.raw).splice(0, n)
        value.value.splice(0, n)
      }
    }

    return value
  }
}

/**
 * Returns integer or any kind of "infinity".
 *
 * https://www.mongodb.com/docs/manual/reference/operator/update/position/
 */
function parsePosition(arg: BSONNode = nNullish()): number {
  if (arg.kind === NodeKind.NULLISH) {
    return Number.POSITIVE_INFINITY
  }
  const n = unwrapNumber(
    arg,
    `$position required a numeric value (got ${arg.kind})`,
  )
  if (Number.isNaN(n) || (Number.isFinite(n) && !Number.isInteger(n))) {
    throw new TypeError(`$position required a numeric value (got ${n})`)
  }
  return n
}

/**
 * Returns a list of BSON nodes.
 *
 * https://www.mongodb.com/docs/manual/reference/operator/update/each/
 */
function parseEach(arg: BSONNode | undefined): BSONNode[] {
  if (!arg) {
    throw new TypeError('Expected $each modifier')
  }
  if (arg.kind !== NodeKind.ARRAY) {
    throw new TypeError(`$slice requires an integer (got ${arg.kind})`)
  }
  return arg.value
}

/**
 * Returns integer or any kind of "infinity".
 *
 * https://www.mongodb.com/docs/manual/reference/operator/update/slice/
 */
function parseSlice(arg: BSONNode = nNullish()): number {
  if (arg.kind === NodeKind.NULLISH) {
    return Number.POSITIVE_INFINITY
  }
  const n = unwrapNumber(arg)
  if (!Number.isInteger(n)) {
    throw new TypeError(`$slice requires an integer (got ${n})`)
  }
  return n
}

/**
 * TODO: $sort modifier
 *
 * https://www.mongodb.com/docs/manual/reference/operator/update/sort/
 */
function parseSort(arg: BSONNode = nNullish()): null {
  if (arg.kind !== NodeKind.NULLISH) {
    throw new Error('$sort modifier is not supported')
  }
  return null
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/
 */
export function $addToSet(arg: BSONNode): UpdateMapper {
  const $each: BSONNode[] =
    arg.kind === NodeKind.OBJECT && arg.keys.some(k => k[0] === '$')
      ? parseEach(arg.value.$each)
      : [arg]

  return value => {
    if (value.kind === NodeKind.NULLISH) {
      return wrapNodes($each)
    }
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$addToSet found an element of non-array type (got ${value.kind})`,
      )
    }

    for (const newItem of $each) {
      if (!value.value.some(oldItem => $eq(oldItem, newItem).value)) {
        expected(value.raw).push(unwrapBSON(newItem))
        value.value.push(newItem)
      }
    }

    return value
  }
}
