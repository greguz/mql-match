export function $literal (args) {
  if (args.length !== 1) {
    throw new Error('Expression $literal takes exactly 1 argument')
  }
  // TODO: validate
  return () => args[0]
}

export function $rand (args) {
  if (args.length !== 0) {
    throw new Error('Expression $rand takes no arguments')
  }
  return () => Math.random()
}
