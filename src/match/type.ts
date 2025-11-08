import { $toBool } from '../expression/type.js'
import { assertBSON, parseBSONType } from '../lib/bson.js'
import { withParsing } from '../lib/match.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nString,
} from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/type/
 */
export function $exists(value: BSONNode, presence: BooleanNode): BooleanNode {
  return nBoolean(
    presence.value
      ? value.kind !== NodeKind.NULLISH
      : value.kind === NodeKind.NULLISH,
  )
}

withParsing<[BooleanNode]>($exists, arg => [$toBool(arg)])

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/type/
 */
export function $type(
  value: BSONNode,
  ...expectedTypes: BSONNode[]
): BooleanNode {
  let result = false
  for (let i = 0; i < expectedTypes.length && !result; i++) {
    result = value.kind === assertBSON(expectedTypes[i], NodeKind.STRING).value
  }
  return nBoolean(result)
}

withParsing($type, arg => {
  return arg.kind === NodeKind.ARRAY
    ? arg.value.map(a => nString(parseBSONType(a)))
    : [nString(parseBSONType(arg))]
})
