/**
 * Compile the MongoDB query to a match function.
 * @param {Object} query
 * @returns {Function}
 */
export declare function compile (query: object): (document: object) => boolean
