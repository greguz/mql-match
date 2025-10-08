import { type BSONNode, NodeKind, nNullish } from './node.js'

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

/**
 * Applies a projection path.
 * Keeps all array items only if at least one item is not nullish.
 */
export function applyProjection(path: Path, node: BSONNode): BSONNode {
  if (!path.length) {
    return node
  }

  if (node.kind === NodeKind.OBJECT) {
    return applyProjection(path.slice(1), node.value[path[0]] || nNullish())
  }

  if (node.kind === NodeKind.ARRAY) {
    const items: BSONNode[] = []

    let empty = true
    for (let i = 0; i < node.value.length; i++) {
      const n = applyProjection(path, node.value[i])
      items.push(n)
      if (n.kind !== NodeKind.NULLISH) {
        empty = false
      }
    }

    if (!empty) {
      return { kind: NodeKind.ARRAY, value: items }
    }
  }

  return nNullish()
}
