import { $regexMatch } from '../expression/string.js'
import { assertBSON } from '../lib/bson.js'
import {
  type BooleanNode,
  type BSONNode,
  NodeKind,
  nNullish,
} from '../lib/node.js'
import { withParsing } from '../lib/operator.js'
import { expected } from '../lib/util.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/regex/
 */
export function $regex(
  input: BSONNode,
  regex: BSONNode,
  options: BSONNode,
): BooleanNode {
  return $regexMatch(input, regex, options)
}

withParsing($regex, arg => {
  // Hacked "parent" object (see `match.ts`)
  const obj = assertBSON(arg, NodeKind.OBJECT).value

  // Always present because hacked
  const regexNode = expected(obj.$regex)
  if (regexNode.kind !== NodeKind.REGEX && regexNode.kind !== NodeKind.STRING) {
    throw new TypeError('$regex has to be a string or regex')
  }

  // TODO: escape?
  let regex: RegExp =
    regexNode.kind === NodeKind.REGEX
      ? regexNode.value
      : new RegExp(regexNode.value)

  const optionsNode = obj.$options
  if (optionsNode) {
    const flags = assertBSON(
      optionsNode,
      NodeKind.STRING,
      '$options has to be a string',
    ).value

    if (regex.flags) {
      throw new TypeError('options set in both $regex and $options')
    }

    // Inject flags
    regex = new RegExp(regex, flags)
  }

  return [{ kind: NodeKind.REGEX, value: regex }, nNullish()]
})
