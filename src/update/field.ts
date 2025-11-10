import { $gt, $lt } from '../expression/comparison.js'
import {
  assertBSON,
  setKey,
  unsetKey,
  unwrapDecimal,
  unwrapNumber,
} from '../lib/bson.js'
import {
  type BSONNode,
  NodeKind,
  nDate,
  nDouble,
  nNullish,
  nTimestamp,
} from '../lib/node.js'
import { Path } from '../lib/path.js'
import type { UpdateMapper, UpdateOperator } from '../lib/update.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/currentDate/
 */
export function $currentDate(arg: BSONNode): UpdateMapper {
  if (arg.kind === NodeKind.BOOLEAN && arg.value === true) {
    return () => nDate()
  }

  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError(
      `${arg.kind} is not valid type for $currentDate. Please use a boolean ('true') or a $type expression ({ $type: 'timestamp/date' }).`,
    )
  }

  const dateType = arg.value.$type || nNullish('$type')
  if (dateType.value === 'date') {
    return () => nDate()
  }
  if (dateType.value === 'timestamp') {
    return () => nTimestamp()
  }

  throw new TypeError(
    `The '$type' string field is required to be 'date' or 'timestamp': { $currentDate: { field : { $type: 'date' } } }`,
  )
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/inc/
 */
export function $inc(arg: BSONNode): UpdateMapper {
  const n = unwrapNumber(arg, 'Cannot increment with non-numeric argument')

  return value => {
    if (value.kind === NodeKind.NULLISH) {
      return arg
    }
    return nDouble(
      unwrapDecimal(
        value,
        `Cannot apply $inc to a value of non-numeric type (got ${value.kind})`,
      ).add(n),
    )
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/min/
 */
export function $min(arg: BSONNode): UpdateMapper {
  return value => {
    if (value.kind === NodeKind.NULLISH) {
      return arg
    }
    return $lt(arg, value).value ? arg : value
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/max/
 */
export function $max(arg: BSONNode): UpdateMapper {
  return value => {
    if (value.kind === NodeKind.NULLISH) {
      return arg
    }
    return $gt(arg, value).value ? arg : value
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/mul/
 */
export function $mul(arg: BSONNode): UpdateMapper {
  const n = unwrapNumber(arg, 'Cannot multiply with non-numeric argument')

  return value => {
    if (value.kind === NodeKind.NULLISH) {
      return nDouble(0)
    }
    return nDouble(
      unwrapDecimal(
        value,
        `Cannot apply $mul to a value of non-numeric type (got ${value.kind})`,
      ).mul(n),
    )
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/rename/
 */
export function $rename(arg: BSONNode, oldPath: Path): UpdateOperator {
  const newPath = Path.parseUpdate(
    assertBSON(arg, NodeKind.STRING, '$rename expects a string').value,
  )

  // TODO: support nested paths
  if (oldPath.segments.length !== 1 || newPath.segments.length !== 1) {
    throw new Error('TODO: $rename and sub-paths not supported')
  }

  // TODO: $rename does not work on embedded documents in arrays.
  return obj => {
    const value =
      obj.value[oldPath.segments[0].raw] || nNullish(oldPath.segments[0].raw)

    unsetKey(obj, oldPath.segments[0].raw)
    if (value.kind !== NodeKind.NULLISH) {
      setKey(obj, newPath.segments[0].raw, value)
    }
  }
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/set/
 */
export function $set(arg: BSONNode): UpdateMapper {
  return () => arg
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/update/unset/
 */
export function $unset(arg: BSONNode, path: Path): UpdateOperator {
  if (arg.value !== '') {
    throw new TypeError('$unset expectes empty strings')
  }

  // TODO: support nested paths
  if (path.segments.length !== 1) {
    throw new Error('TODO: $unset and sub-paths not supported')
  }

  // TODO: questo funziona con gli array, usando gli indici dentro al path
  return obj => {
    unsetKey(obj, path.segments[0].raw)
  }
}
