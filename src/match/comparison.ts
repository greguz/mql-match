import * as comparison from '../expression/comparison.js'
import { type BooleanNode, type BSONNode, nString } from '../lib/node.js'

export function $eq([arg]: BSONNode[]): BooleanNode {
  return comparison.$eq([nString('SUBJECT'), arg])
}
