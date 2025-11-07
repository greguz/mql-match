import { assertBSON } from '../lib/bson.js'
import { withParsing } from '../lib/expression.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nBoolean,
  nNullish,
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

  let regex: RegExp = unwrapRegExp(regexNode)

  if (optionsNode.kind !== NodeKind.NULLISH) {
    const flags = assertBSON(
      optionsNode,
      NodeKind.STRING,
      "$regexMatch needs 'options' to be of type string",
    ).value

    if (regex.flags) {
      throw new TypeError(
        "$regexMatch: found regex option(s) specified in both 'regex' and 'option' fields",
      )
    }

    // Inject flags
    regex = new RegExp(regex, flags)
  }

  return nBoolean(regex.test(input))
}

function unwrapRegExp(node: BSONNode): RegExp {
  switch (node.kind) {
    case NodeKind.REGEX:
      return node.value
    case NodeKind.STRING:
      return new RegExp(node.value) // TODO: escape?
    default:
      throw new TypeError(
        "$regexMatch needs 'regex' to be of type string or regex",
      )
  }
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
