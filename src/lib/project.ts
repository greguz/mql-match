import { wrapBSON } from './bson.js'
import { NodeKind, type PathNode, type ProjectNode } from './node.js'
import { type Path, parsePath } from './path.js'
import { expected, isPlainObject } from './util.js'

export function parseProjection(project: unknown): ProjectNode {
  if (!isPlainObject(project)) {
    throw new TypeError('Projection must be an object')
  }
  return parseProjectionInternal(project, true)
}

function parseProjectionInternal(
  obj: Record<string, unknown>,
  root: boolean,
): ProjectNode {
  const keys = Object.keys(obj)
  if (!keys.length) {
    throw new TypeError('Projection need at least one field')
  }

  const project: ProjectNode = {
    kind: NodeKind.PROJECT,
    nodes: [],
    exclusion: false,
  }

  let inclusion = false

  for (const key of keys) {
    const path = parsePath(key)
    const value = obj[key]

    for (let i = 0; i < project.nodes.length; i++) {
      if (collides(path, project.nodes[i].path)) {
        throw new TypeError(`Projection path collision at ${key}`)
      }
    }

    if (isPlainObject(value)) {
      const child = parseProjectionInternal(value, false)
      if (project.exclusion && !child.exclusion) {
        throw new TypeError(
          `Cannot do inclusion on field ${key} in exclusion projection`,
        )
      }
      if (inclusion && child.exclusion) {
        throw new TypeError(
          `Cannot do exclusion on field ${key} in inclusion projection`,
        )
      }
      inclusion = !child.exclusion
      project.exclusion = child.exclusion

      project.nodes.push({ kind: NodeKind.PATH, path, value: child })
    } else {
      if (value !== 0 && value !== false) {
        inclusion = true
        if (project.exclusion) {
          throw new TypeError(
            `Cannot do inclusion on field ${key} in exclusion projection`,
          )
        }
      } else if (key !== '_id' || !root) {
        project.exclusion = true
        if (inclusion) {
          throw new TypeError(
            `Cannot do exclusion on field ${key} in inclusion projection`,
          )
        }
      }

      project.nodes.push({ kind: NodeKind.PATH, path, value: wrapBSON(value) })
    }
  }

  return normalizeProjection(project)
}

function collides(a: Path, b: Path) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

function normalizeProjection(project: ProjectNode): ProjectNode {
  // Resulting nodes
  const nodes: PathNode[] = []

  // Group by first path's chunk
  const groups: Record<string, PathNode[]> = {}
  for (const node of project.nodes) {
    const key = node.path[0]
    const value = groups[key] || []
    value.push(node)
    value.sort((a, b) => a.path.length - b.path.length)
    groups[key] = value
  }

  for (const group of Object.values(groups)) {
    if (group.length <= 1) {
      // Single-element group
      nodes.push(expected(group[0]))
      continue
    }

    const path: Path = [group[0].path[0]]

    // First node is the shortest
    const count = group[0].path.length - 1

    for (let i = 1; i < count; i++) {
      if (group[0].path[i] !== group[1].path[i]) {
        break
      }
      path.push(group[0].path[i])
    }

    nodes.push({
      kind: NodeKind.PATH,
      path,
      value: normalizeProjection({
        kind: NodeKind.PROJECT,
        exclusion: project.exclusion,
        nodes: group.map(n => ({
          kind: n.kind,
          path: n.path.slice(path.length),
          value: n.value,
        })),
      }),
    })
  }

  return {
    kind: NodeKind.PROJECT,
    exclusion: project.exclusion,
    nodes,
  }
}
