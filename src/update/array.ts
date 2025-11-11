import { $cmp, $eq } from '../expression/comparison.js'
import { assertBSON, unwrapBSON, unwrapNumber, wrapNodes } from '../lib/bson.js'
import {
  type ArrayNode,
  type BSONNode,
  NodeKind,
  nNullish,
} from '../lib/node.js'
import { Path } from '../lib/path.js'
import type { UpdateMapper } from '../lib/update.js'
import { expected } from '../lib/util.js'
import { compileMatch } from '../match.js'

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
  const match = compileMatch(arg)

  return value => {
    if (value.kind !== NodeKind.ARRAY) {
      throw new TypeError(
        `$pull found an element of non-array type (got ${value.kind})`,
      )
    }

    let i = 0
    while (i < value.value.length) {
      if (match(value.value[i]).value) {
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
  let $sort: SortModifier | null
  let $slice: number

  if (arg.kind === NodeKind.OBJECT && arg.keys.some(k => k[0] === '$')) {
    $each = parseEach(arg.value.$each)
    $position = parsePosition(arg.value.$position)
    $sort = parseSort(arg.value.$sort)
    $slice = parseSlice(arg.value.$slice)
  } else {
    $each = [arg]
    $position = parsePosition()
    $sort = parseSort()
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

    if ($sort) {
      $sort(value)
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
 * Compiled operator.
 */
type SortModifier = (node: ArrayNode) => void

/**
 * Comparing callback used by sort function.
 */
type SortCompare = (a: BSONNode, b: BSONNode) => number

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/sort/
 */
function parseSort(arg: BSONNode = nNullish()): SortModifier | null {
  if (arg.kind === NodeKind.NULLISH) {
    return null
  }
  if (arg.value === 1 || arg.value === -1) {
    return sortWith(arg.value === -1 ? reverse(compareBSON) : compareBSON)
  }
  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError(
      'The $sort is invalid: use 1/-1 to sort the whole element, or {field:1/-1} to sort embedded fields',
    )
  }
  if (!arg.keys.length) {
    return null
  }
  if (arg.keys.length !== 1) {
    throw new Error('Multiple $sort keys are not supported') // TODO: is it supported by MongoDB?
  }

  const path = Path.parse(arg.keys[0])
  const value = expected(arg.value[arg.keys[0]])
  if (value.value !== 1 && value.value !== -1) {
    throw new TypeError('The sort element value must be either 1 or -1')
  }

  const byPath = (a: BSONNode, b: BSONNode) =>
    compareBSON(path.read(a), path.read(b))

  return sortWith(value.value === -1 ? reverse(byPath) : byPath)
}

/**
 * Default BSON sort (mathes `SortCompare` type).
 */
function compareBSON(a: BSONNode, b: BSONNode): number {
  return $cmp(a, b).value
}

/**
 * Reverse the compare result (from asc to desc).
 */
function reverse(compare: SortCompare): SortCompare {
  return (a, b) => -compare(a, b)
}

/**
 * Binding.
 */
function sortWith(compare: SortCompare): SortModifier {
  return node => bubbleSort(node, compare)
}

/**
 * Because it's the algorithm this package deserves, but not the one it needs right now.
 */
function bubbleSort(node: ArrayNode, compare: SortCompare) {
  const length = node.value.length

  for (let j = 0; j < length - 1; j++) {
    // Last i elements are already in place
    for (let k = 0; k < length - j - 1; k++) {
      const result = compare(node.value[k], node.value[k + 1])

      // Swap if the element found is greater than the next element
      if (result > 0) {
        const tempBSON = node.value[k]
        node.value[k] = node.value[k + 1]
        node.value[k + 1] = tempBSON

        if (node.raw) {
          const temp = node.raw[k]
          node.raw[k] = node.raw[k + 1]
          node.raw[k + 1] = temp
        }
      }
    }
  }
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
