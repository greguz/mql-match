import {
  setIndex,
  setKey,
  wrapBSON,
  wrapNodes,
  wrapObjectRaw,
} from './lib/bson.js'
import {
  type BSONNode,
  NodeKind,
  nNullish,
  nString,
  type UpdatePathNode,
} from './lib/node.js'
import { parseQueryArgs, type QueryOperator } from './lib/operator.js'
import { type Path, parsePath } from './lib/path.js'
import { expected, isPlainObject } from './lib/util.js'
import { $addToSet, $pop, $pull, $pullAll, $push } from './update/array.js'
import {
  $currentDate,
  $inc,
  $max,
  $min,
  $mul,
  $rename,
  $set,
  $unset,
} from './update/fields.js'

const OPERATORS: Record<string, QueryOperator<any[]> | undefined> = {
  $addToSet,
  $currentDate,
  $inc,
  $max,
  $min,
  $mul,
  $pop,
  $pull,
  $pullAll,
  $push,
  $rename,
  $set,
  $unset,
}

export function* parseUpdate(obj: unknown): Generator<UpdatePathNode> {
  if (!isPlainObject(obj)) {
    throw new TypeError() // TODO: error message
  }

  for (const key of Object.keys(obj)) {
    const fn = OPERATORS[key]
    if (!fn) {
      throw new TypeError(`Unsupported update operator: ${key}`)
    }

    yield* parseOperator(fn, obj[key])
  }
}

function* parseOperator<T extends unknown[]>(
  operator: QueryOperator<T>,
  obj: unknown,
): Generator<UpdatePathNode> {
  if (!isPlainObject(obj)) {
    throw new TypeError() // TODO: error message
  }

  for (const key of Object.keys(obj)) {
    yield {
      kind: NodeKind.UPDATE_PATH,
      operator: operator.name,
      path: parsePath(key),
      args: parseQueryArgs<T>(operator, wrapBSON(obj[key])),
    }
  }
}

export function evalUpdate(nodes: UpdatePathNode[], subject: BSONNode): void {
  for (const node of nodes) {
    const fn = expected(OPERATORS[node.operator])

    if (fn.useParent) {
      // Operators that updates the parent object (relative to requested path)
      const key = nString(`${expected(node.path.pop())}`)
      const parent = readValue(node.path, subject)
      fn(parent, key, ...node.args)
    } else {
      // Operators that updates the actual path's value
      const oldValue = readValue(node.path, subject)
      const newValue = fn(oldValue, ...node.args)
      writeValue(node.path, subject, newValue)
    }
  }
}

function readValue(path: Path, node: BSONNode): BSONNode {
  if (!path.length) {
    return node
  }
  if (node.kind === NodeKind.OBJECT) {
    return readValue(path.slice(1), node.value[path[0]] || nNullish())
  }

  if (node.kind === NodeKind.ARRAY) {
    const items: BSONNode[] = []

    for (let i = 0; i < node.value.length; i++) {
      const n = readValue(path, node.value[i])
      if (n.kind !== NodeKind.NULLISH) {
        items.push(n)
      }
    }

    if (items.length) {
      return wrapNodes(items)
    }
  }

  return nNullish()
}

function writeValue(path: Path, obj: BSONNode, value: BSONNode): void {
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    const next = i === path.length - 1 ? value : wrapObjectRaw()

    if (typeof key === 'number' && obj.kind === NodeKind.ARRAY) {
      if (next === value || obj.value.length <= key) {
        obj = setIndex(obj, key, next)
      } else {
        obj = obj.value[key]
      }
    } else if (obj.kind === NodeKind.OBJECT) {
      if (next === value || !obj.value[key]) {
        obj = setKey(obj, `${key}`, next)
      } else {
        obj = expected(obj.value[key])
      }
    } else {
      throw new TypeError(`Unable to write value at ${path.join('.')}`)
    }
  }
}
