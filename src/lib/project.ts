import {
  NodeKind,
  type ObjectNode,
  type ProjectNode,
  type ProjectPathNode,
} from './node.js'
import { type Path, parsePath } from './path.js'
import { expected } from './util.js'

export function parseProjection(node: ObjectNode): ProjectNode {
  return parseProjectionInternal(node, true)
}

function parseProjectionInternal(node: ObjectNode, root: boolean): ProjectNode {
  if (!node.keys.length) {
    throw new TypeError('Projection need at least one field')
  }

  const project: ProjectNode = {
    kind: NodeKind.PROJECT,
    nodes: [],
    exclusion: false,
  }

  let inclusion = false

  for (const key of node.keys) {
    const path = parsePath(key)
    const childNode = expected(node.value[key])

    for (let i = 0; i < project.nodes.length; i++) {
      if (collides(path, project.nodes[i].path)) {
        throw new TypeError(`Projection path collision at ${key}`)
      }
    }

    if (childNode.kind === NodeKind.OBJECT) {
      const childProject = parseProjectionInternal(childNode, false)
      if (project.exclusion && !childProject.exclusion) {
        throw new TypeError(
          `Cannot do inclusion on field ${key} in exclusion projection`,
        )
      }
      if (inclusion && childProject.exclusion) {
        throw new TypeError(
          `Cannot do exclusion on field ${key} in inclusion projection`,
        )
      }
      inclusion = !childProject.exclusion
      project.exclusion = childProject.exclusion

      project.nodes.push({
        kind: NodeKind.PROJECT_PATH,
        path,
        value: childProject,
      })
    } else {
      if (childNode.value !== 0 && childNode.value !== false) {
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

      project.nodes.push({
        kind: NodeKind.PROJECT_PATH,
        path,
        value: childNode,
      })
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
  const nodes: ProjectPathNode[] = []

  // Group by first path's chunk
  const groups: Record<string, ProjectPathNode[]> = {}
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
      kind: NodeKind.PROJECT_PATH,
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
