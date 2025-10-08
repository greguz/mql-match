import { Timestamp } from 'bson'

import {
  type BSONNode,
  type DateNode,
  NodeKind,
  type TimestampNode,
} from '../lib/node.js'
import { useRoot } from '../lib/operator.js'

export function $$CLUSTER_TIME(): TimestampNode {
  return {
    kind: NodeKind.TIMESTAMP,
    value: Timestamp.fromNumber(Date.now() / 1000),
  }
}

export function $$NOW(): DateNode {
  return {
    kind: NodeKind.DATE,
    value: new Date(),
  }
}

export function $$ROOT(root: BSONNode): BSONNode {
  return root
}

useRoot($$ROOT)
