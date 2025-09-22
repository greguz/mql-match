import { Timestamp } from 'bson'

import {
  type BSONNode,
  type DateNode,
  NodeKind,
  type TimestampNode,
} from '../lib/node.js'
import { withArguments } from '../lib/operator.js'

export function $$CLUSTER_TIME(): TimestampNode {
  return {
    kind: NodeKind.TIMESTAMP,
    value: Timestamp.fromNumber(Date.now() / 1000),
  }
}

withArguments($$CLUSTER_TIME, 0)

export function $$NOW(): DateNode {
  return {
    kind: NodeKind.DATE,
    value: new Date(),
  }
}

withArguments($$NOW, 0)

export function $$ROOT(): BSONNode {
  throw new Error('TODO: $$ROOT variable')
}

withArguments($$ROOT, 0)
