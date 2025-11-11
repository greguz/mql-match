import { type BSONNode, NodeKind } from './lib/node.js'
import { Path } from './lib/path.js'
import {
  type UpdateContext,
  type UpdateOperator,
  type UpdateOperatorConstructor,
  wrapOperator,
} from './lib/update.js'
import { expected } from './lib/util.js'
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
} from './update/field.js'

const OPERATORS: Record<string, UpdateOperatorConstructor | undefined> = {
  $addToSet: wrapOperator($addToSet),
  $currentDate: wrapOperator($currentDate),
  $inc: wrapOperator($inc),
  $max: wrapOperator($max),
  $min: wrapOperator($min),
  $mul: wrapOperator($mul),
  $pop: wrapOperator($pop),
  $pull: wrapOperator($pull),
  $pullAll: wrapOperator($pullAll),
  $push: wrapOperator($push),
  $rename,
  $set: wrapOperator($set),
  $unset,
}

/**
 * Updates the argument with the requested changes.
 */
export type UpdateQuery = (doc: BSONNode) => void

/**
 * Compiles an update query into a update function.
 */
export function compileUpdate(node: BSONNode): UpdateQuery {
  if (node.kind !== NodeKind.OBJECT) {
    throw new TypeError('Update query must be an object')
  }

  const ctx: UpdateContext = {
    positions: new Map(),
  }

  const fns: UpdateOperator[] = []

  for (const key of node.keys) {
    const $operator = OPERATORS[key]
    if (!$operator) {
      throw new TypeError(`Unsupported update operator: ${key}`)
    }

    for (const fn of compileOperator($operator, expected(node.value[key]))) {
      fns.push(fn)
    }
  }

  return doc => {
    if (doc.kind === NodeKind.OBJECT) {
      for (const fn of fns) {
        fn(doc, ctx)
      }
    }
  }
}

function* compileOperator(
  $operator: UpdateOperatorConstructor,
  node: BSONNode,
): Generator<UpdateOperator> {
  if (node.kind !== NodeKind.OBJECT) {
    throw new TypeError('Expected object')
  }
  for (const key of node.keys) {
    yield $operator(expected(node.value[key]), Path.parseUpdate(key))
  }
}
