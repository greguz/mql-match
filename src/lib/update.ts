import {
  type BSONNode,
  NodeKind,
  nNullish,
  type ObjectNode,
} from '../lib/node.js'
import { type Path, PathSegmentKind } from '../lib/path.js'
import { setIndex, setKey, wrapObjectRaw } from './bson.js'
import { expected } from './util.js'

export interface UpdateContext {
  /**
   * Key is the matched document.
   * Value is the index.
   *
   * @see https://www.mongodb.com/docs/manual/reference/operator/update/positional/
   */
  positions: Map<unknown, number>
}

/**
 * Takes the object to modify and applies the requested updates.
 */
export type UpdateOperator = (obj: ObjectNode, ctx: UpdateContext) => void

/**
 * Accepts a BSON argument, the path to modify,
 * and returns the operator function that performs the update.
 */
export type UpdateOperatorConstructor = (
  arg: BSONNode,
  path: Path,
) => UpdateOperator

/**
 * Map from the current BSON value into another value.
 */
export type UpdateMapper = (value: BSONNode) => BSONNode

/**
 * Accepts a BSON argument and returns a BSON mapper.
 */
export type UpdateMapperConstructor = (arg: BSONNode) => UpdateMapper

/**
 * Cast a mapper constructor into a standard operator constructor.
 */
export function wrapOperator(
  $operator: UpdateMapperConstructor,
): UpdateOperatorConstructor {
  return (arg: BSONNode, path: Path): UpdateOperator => {
    const map = $operator(arg)
    return (obj: ObjectNode): void => {
      setPathValue(obj, path, map(getPathValue(obj, path)))
    }
  }
}

/**
 * Single value, exact match, index included.
 */
export function getPathValue(node: BSONNode, path: Path): BSONNode {
  for (
    let i = 0;
    i < path.segments.length && node.kind !== NodeKind.NULLISH;
    i++
  ) {
    const segment = path.segments[i]

    switch (node.kind) {
      case NodeKind.ARRAY:
        node =
          segment.kind === PathSegmentKind.INDEX
            ? node.value[segment.index] || nNullish(segment.raw)
            : nNullish(segment.raw)
        break
      case NodeKind.OBJECT:
        node = node.value[segment.raw] || nNullish(segment.raw)
        break
      default:
        node = nNullish(segment.raw)
        break
    }
  }

  return node
}

/**
 * Always creates objects.
 */
export function setPathValue(
  node: BSONNode,
  path: Path,
  value: BSONNode,
): void {
  for (let i = 0; i < path.segments.length; i++) {
    const segment = path.segments[i]
    const next = i === path.segments.length - 1 ? value : wrapObjectRaw()

    if (
      segment.kind === PathSegmentKind.INDEX &&
      node.kind === NodeKind.ARRAY
    ) {
      if (next === value || node.value.length <= segment.index) {
        node = setIndex(node, segment.index, next)
      } else {
        node = node.value[segment.index]
      }
    } else if (node.kind === NodeKind.OBJECT) {
      if (next === value || !node.value[segment.raw]) {
        node = setKey(node, segment.raw, next)
      } else {
        node = expected(node.value[segment.raw])
      }
    } else {
      throw new TypeError(`Unable to write value at ${path.raw}`)
    }
  }
}
