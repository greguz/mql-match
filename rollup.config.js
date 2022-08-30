export default {
  input: './src/index.mjs',
  output: [
    {
      file: './mql-match.mjs',
      format: 'es'
    },
    {
      file: './mql-match.cjs',
      format: 'cjs'
    }
  ]
}
