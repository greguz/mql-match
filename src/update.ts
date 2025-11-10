import { wrapBSON } from './lib/bson.js'
import { type BSONNode, NodeKind } from './lib/node.js'
import { Path } from './lib/path.js'
import {
  type UpdateContext,
  type UpdateOperator,
  type UpdateOperatorConstructor,
  wrapOperator,
} from './lib/update.js'
import { isPlainObject } from './lib/util.js'
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

export function* parseUpdate(obj: unknown): Generator<UpdateOperator> {
  if (!isPlainObject(obj)) {
    throw new TypeError('Update query must be an object')
  }

  for (const key of Object.keys(obj)) {
    const $operator = OPERATORS[key]
    if (!$operator) {
      throw new TypeError(`Unsupported update operator: ${key}`)
    }

    yield* parseOperator($operator, obj[key])
  }
}

function* parseOperator(
  $operator: UpdateOperatorConstructor,
  obj: unknown,
): Generator<UpdateOperator> {
  if (!isPlainObject(obj)) {
    throw new TypeError('Expected object')
  }
  for (const key of Object.keys(obj)) {
    yield $operator(wrapBSON(obj[key]), Path.parseUpdate(key))
  }
}

export function evalUpdate(
  ctx: UpdateContext,
  operators: UpdateOperator[],
  doc: BSONNode,
): void {
  if (doc.kind === NodeKind.OBJECT) {
    for (const fn of operators) {
      fn(doc, ctx)
    }
  }
}
