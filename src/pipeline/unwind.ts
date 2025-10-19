import { setKey } from '../lib/bson.js'
import {
  type BSONNode,
  NodeKind,
  nDouble,
  nNullish,
  type ObjectNode,
} from '../lib/node.js'
import { withStageParsing } from '../lib/operator.js'
import { type Path, parsePath } from '../lib/path.js'
import { expected } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/
 */
export function* $unwind(
  docs: Iterable<BSONNode>,
  path: Path,
  includeArrayIndex: string,
  preserveNullAndEmptyArrays: boolean,
): Iterable<BSONNode> {
  for (const doc of docs) {
    const node = getPathValue(doc, path)

    if (node.kind === NodeKind.ARRAY && node.value.length) {
      for (let i = 0; i < node.value.length; i++) {
        yield setPathValue(
          doc,
          path,
          includeArrayIndex,
          node.value[i],
          nDouble(i),
        )
      }
    } else if (node.kind !== NodeKind.ARRAY && node.kind !== NodeKind.NULLISH) {
      yield setPathValue(doc, path, includeArrayIndex, node, nNullish())
    } else if (preserveNullAndEmptyArrays) {
      yield setPathValue(doc, path, includeArrayIndex, nNullish(), nNullish())
    }
  }
}

withStageParsing($unwind, arg => {
  if (arg.kind === NodeKind.STRING) {
    return [parseUnwindPath(arg), '', false] as const
  }
  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError(
      `expected either a string or an object as specification for $unwind stage (got ${arg.kind})`,
    )
  }

  return [
    parseUnwindPath(arg.value.path),
    parseIndexField(arg.value.includeArrayIndex),
    parseUnwindBoolean(arg.value.preserveNullAndEmptyArrays),
  ] as const
})

function parseUnwindPath(node: BSONNode = nNullish()): Path {
  if (node.kind !== NodeKind.STRING) {
    throw new TypeError(
      `expected a string as the path for $unwind stage (got ${node.kind})`,
    )
  }
  if (node.value[0] !== '$') {
    throw new TypeError(
      `path option to $unwind stage should be prefixed with a "$" (got ${node.value})`,
    )
  }
  return parsePath(node.value.substring(1))
}

function parseIndexField(node: BSONNode = nNullish()): string {
  if (node.kind === NodeKind.NULLISH) {
    return ''
  }
  if (node.kind !== NodeKind.STRING || node.value === '') {
    throw new TypeError(
      `expected a non-empty string for the includeArrayIndex option to $unwind stage (got ${node.kind})`,
    )
  }
  if (node.value[0] === '$') {
    throw new TypeError(
      `includeArrayIndex option to $unwind stage should not be prefixed with a "$" (got ${node.value})`,
    )
  }
  return node.value
}

function parseUnwindBoolean(node: BSONNode = nNullish()): boolean {
  if (node.kind === NodeKind.NULLISH) {
    return false
  }
  if (node.kind === NodeKind.BOOLEAN) {
    return node.value
  }
  throw new TypeError(
    `preserveNullAndEmptyArrays option to $unwind stage (got ${node.kind})`,
  )
}

function getPathValue(node: BSONNode, path: Path): BSONNode {
  for (let i = 0; i < path.length && node.kind !== NodeKind.NULLISH; i++) {
    if (node.kind === NodeKind.OBJECT) {
      node = node.value[`${path[i]}`] || nNullish()
    } else {
      node = nNullish()
    }
  }
  return node
}

/**
 * This also clones the object.
 */
function setPathValue(
  document: BSONNode,
  path: Path,
  includeArrayIndex: string,
  value: BSONNode,
  index: BSONNode,
): BSONNode {
  const result: ObjectNode = copyObject(document)
  if (includeArrayIndex) {
    setKey(result, includeArrayIndex, index)
  }

  let subject: ObjectNode = result
  for (let i = 0; i < path.length; i++) {
    const key = `${path[i]}`

    if (i === path.length - 1) {
      setKey(subject, key, value)
    } else {
      subject = copyObject(expected(subject.value[key]))
    }
  }

  return result
}

function copyObject(obj: BSONNode): ObjectNode {
  if (obj.kind !== NodeKind.OBJECT) {
    throw new TypeError('Expected object node to copy')
  }
  return {
    kind: NodeKind.OBJECT,
    keys: [...obj.keys],
    value: { ...obj.value },
    raw: undefined,
  }
}
