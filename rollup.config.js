export default {
  input: './mql-match.mjs',
  output: {
    file: './mql-match.cjs',
    format: 'cjs'
  },
  external: ['decimal.js', 'bson', 'buffer']
}
