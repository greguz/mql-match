export function $literal (args) {
  if (args.length !== 1) {
    throw new Error('Expression $literal takes exactly 1 argument')
  }
  // TODO: validate?
  return () => args[0]
}
