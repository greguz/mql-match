import { setIndex, setKey, wrapObject } from './bson.js'
import { type BSONNode, NodeKind } from './node.js'

const REG_IDENTIFIER = /^[A-Za-z0-9_]*$/

const REG_INDEX = /^\d+$/

/**
 * Parsed MongoDB key path (like `"items.1.label"`).
 */
export type Path = Array<number | string>

export function parsePath(path: unknown): Path {
  if (typeof path !== 'string') {
    throw new TypeError(
      `MongoDB field path must be a string, got ${typeof path} (${path})`,
    )
  }

  const result: Path = []
  for (const chunk of path.split('.')) {
    if (REG_INDEX.test(chunk)) {
      result.push(Number.parseInt(chunk, 10))
    } else if (REG_IDENTIFIER.test(chunk)) {
      result.push(chunk)
    } else {
      throw new TypeError(`Unsupported field path format: ${path}`)
    }
  }

  return result
}

export function setPathValue(path: Path, obj: BSONNode, value: BSONNode): void {
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const next = i === path.length - 1 ? value : wrapObject()

    if (typeof key === 'number' && obj.kind === NodeKind.ARRAY) {
      obj = setIndex(obj, key, next)
    } else if (obj.kind === NodeKind.OBJECT) {
      obj = setKey(obj, `${key}`, next)
    } else {
      throw new TypeError(`Unable to write value at ${path.join('.')}`)
    }
  }
}
