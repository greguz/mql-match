import { wrapBSON, wrapNodes } from './lib/bson.js'
import {
  type BSONNode,
  NodeKind,
  nNullish,
  type UpdatePathNode,
} from './lib/node.js'
import { type Operator, parseOperatorArguments } from './lib/operator.js'
import { type Path, parsePath, setPathValue } from './lib/path.js'
import { expected, isPlainObject } from './lib/util.js'
import { $inc } from './update/fields.js'

const OPERATORS: Record<string, Operator | undefined> = {
  $inc,
}

export function compileUpdate(obj: unknown) {
  const nodes = Array.from(parseUpdate(obj))

  // TODO: this thing
  // if (ctx.insert && isNullish(document._id)) {
  //   document._id = new ObjectId()
  // }

  // TODO: "insert" flag
  return (doc: unknown, insert?: boolean): unknown => {
    resolveUpdate(nodes, wrapBSON(doc))
    return doc
  }
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

function* parseOperator(
  operator: Operator,
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
      args: parseOperatorArguments(operator, [wrapBSON(obj[key])]),
    }
  }
}

export function resolveUpdate(
  nodes: UpdatePathNode[],
  subject: BSONNode,
): void {
  for (const node of nodes) {
    const fn = expected(OPERATORS[node.operator])
    const oldValue = readValue(node.path, subject)
    const newValue = fn(oldValue, ...node.args)
    setPathValue(node.path, subject, newValue)
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
