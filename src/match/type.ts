import { $toBool } from '../expression/type.js'
import { assertBSON, parseBSONType } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nString,
} from '../lib/node.js'
import { withQueryParsing } from '../lib/operator.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/type/
 */
export function $exists(value: BSONNode, presence: BSONNode): BooleanNode {
  return nBoolean(
    assertBSON(presence, NodeKind.BOOLEAN).value
      ? value.kind !== NodeKind.NULLISH
      : value.kind === NodeKind.NULLISH,
  )
}

withQueryParsing<[BSONNode]>($exists, arg => [$toBool(arg)])

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

withQueryParsing($type, arg => {
  return arg.kind === NodeKind.ARRAY
    ? arg.value.map(a => nString(parseBSONType(a)))
    : [nString(parseBSONType(arg))]
})
