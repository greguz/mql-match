import type { BSONNode } from './node.js'

/**
 * Accepts an iterable of documents and returns a new iterable of documents.
 * A document can be any value (non-objects).
 */
export type PipelineOperator = (docs: Iterable<BSONNode>) => Iterable<BSONNode>

/**
 * Stage constructor.
 */
export type PipelineOperatorConstructor = (arg: BSONNode) => PipelineOperator
