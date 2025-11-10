import { assertBSON, unwrapRegex } from '../lib/bson.js'
import { withParsing } from '../lib/expression.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nNullish,
  nString,
  type StringNode,
} from '../lib/node.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/regexMatch/
 */
export function $regexMatch(
  inputNode: BSONNode,
  regexNode: BSONNode,
  optionsNode: BSONNode,
): BooleanNode {
  const input: string = assertBSON(
    inputNode,
    NodeKind.STRING,
    "$regexMatch needs 'input' to be of type string",
  ).value

  const regex = unwrapRegex(
    '$regexMatch',
    regexNode,
    'input',
    optionsNode,
    'options',
  )

  return nBoolean(regex.test(input))
}

withParsing($regexMatch, arg => {
  if (arg.kind !== NodeKind.OBJECT) {
    throw new TypeError(
      `$regexMatch expects an object of named arguments (found ${arg.kind})`,
    )
  }

  const inputNode = arg.value.input
  if (!inputNode) {
    throw new TypeError("$regexMatch requires 'input' parameter")
  }

  const regexNode = arg.value.regex
  if (!regexNode) {
    throw new TypeError("$regexMatch requires 'regex' parameter")
  }

  return [inputNode, regexNode, arg.value.options || nNullish()]
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLower/
 */
export function $toLower(node: BSONNode): StringNode {
  if (node.kind === NodeKind.NULLISH) {
    return nString('')
  }

  const input = assertBSON(
    node,
    NodeKind.STRING,
    "$toLower needs 'input' to be of type string",
  ).value

  return nString(input.toLowerCase())
}
