/**
 * Compiles a MongoDB aggregation pipeline to a mapping function.
 */
export declare function compileAggregationPipeline(
  pipeline: any[]
): (iterable: Iterable<any> | AsyncIterable<any>) => AsyncIterable<any>;

/**
 * Compiles a MongoDB filter query to a match function.
 */
export declare function compileFilterQuery(
  query: object
): (data: any) => boolean;

/**
 * Compiles a MongoDB update query to an update function.
 */
export declare function compileUpdateQuery(
  query: object
): (data: any, insert?: boolean) => any;
