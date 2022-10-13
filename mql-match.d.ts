/**
 * Compiles a MongoDB filter query to a match function.
 */
export declare function compileFilterQuery(
  query: object
): (document: any) => boolean;

/**
 * Compiles a MongoDB update query to an update function.
 */
export declare function compileUpdateQuery(
  query: object
): (document: any, insert?: boolean) => any;
