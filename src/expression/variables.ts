import { Timestamp } from 'bson'

import type { OperatorNode } from '../node.js'

export const $$CLUSTER_TIME: OperatorNode = {
  kind: 'OPERATOR',
  args: [],
  operator: () => ({
    kind: 'TIMESTAMP',
    value: Timestamp.fromNumber(Date.now() / 1000),
  }),
}

export const $$NOW: OperatorNode = {
  kind: 'OPERATOR',
  args: [],
  operator: () => ({
    kind: 'DATE',
    value: new Date(),
  }),
}

export const $$ROOT: OperatorNode = {
  kind: 'OPERATOR',
  args: [],
  operator: () => {
    // TODO: fix
    throw new Error('TODO: $$ROOT variable')
  },
}
