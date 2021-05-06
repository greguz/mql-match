export function compileDate (value) {
  const date = value.toISOString()
  if (!/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z$/.test(date)) {
    throw new Error('Unexpected date value')
  }
  return JSON.stringify(date)
}

export function serializeDate (variable) {
  return `${variable} instanceof Date ? ${variable}.toISOString() : null`
}
