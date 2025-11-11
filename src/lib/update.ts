import {
  type BSONNode,
  NodeKind,
  nMissing,
  nNullish,
  type ObjectNode,
} from '../lib/node.js'
import { type Path, type Segment, SegmentKind } from '../lib/path.js'
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
      mapPathValues(obj, path.segments, map)
    }
  }
}

export function mapPathValues(
  node: BSONNode,
  path: Segment[],
  map: UpdateMapper,
): void {
  if (!path.length) {
    throw new Error('Expected path segment') // shouldn't be possible
  }

  const segment = path[0]

  switch (segment.kind) {
    case SegmentKind.ARRAY_WIDE_UPDATE: {
      if (node.kind !== NodeKind.ARRAY) {
        throw new Error(`Cannot write path segment "${segment.raw}"`)
      }

      for (let i = 0; i < node.value.length; i++) {
        if (path.length === 1) {
          setIndex(node, i, map(node.value[i]))
        } else {
          mapPathValues(node.value[i], path.slice(1), map)
        }
      }

      break
    }

    case SegmentKind.IDENTIFIER: {
      if (node.kind !== NodeKind.OBJECT) {
        throw new Error(`Cannot write path segment "${segment.raw}"`)
      }

      if (path.length === 1) {
        setKey(
          node,
          segment.raw,
          map(node.value[segment.raw] || nMissing(segment.raw)),
        )
      } else {
        mapPathValues(
          node.keys.includes(segment.raw)
            ? expected(node.value[segment.raw])
            : setKey(node, segment.raw, wrapObjectRaw()),
          path.slice(1),
          map,
        )
      }

      break
    }

    case SegmentKind.INDEX: {
      if (node.kind === NodeKind.ARRAY) {
        if (path.length === 1) {
          setIndex(
            node,
            segment.index,
            map(node.value[segment.index] || nNullish()),
          )
        } else {
          mapPathValues(
            segment.index >= node.value.length
              ? setIndex(node, segment.index, wrapObjectRaw())
              : node.value[segment.index],
            path.slice(1),
            map,
          )
        }
      } else if (node.kind === NodeKind.OBJECT) {
        if (path.length === 1) {
          setKey(
            node,
            segment.raw,
            map(node.value[segment.raw] || nMissing(segment.raw)),
          )
        } else {
          mapPathValues(
            node.keys.includes(segment.raw)
              ? expected(node.value[segment.raw])
              : setKey(node, segment.raw, wrapObjectRaw()),
            path.slice(1),
            map,
          )
        }
      } else {
        throw new Error(`Cannot write path segment "${segment.raw}"`)
      }
      break
    }

    default:
      throw new Error(`Unsupported path segment kind: ${segment.kind}`)
  }
}
