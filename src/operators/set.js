function serialize (value) {
  if (value === undefined || value === null) {
    return 'null'
  } else if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  } else if (Number.isFinite(value)) {
    return value.toString()
  } else if (typeof value === 'bigint') {
    return `${value.toString()}n`
  } else if (typeof value === 'string') {
    return JSON.stringify(value)
  } else if (value instanceof Date) {
    return `new Date(${value.getTime()})`
  } else {
    throw new Error(`Invalid value to set: ${value}`)
  }
}

export function $set (variable, value) {
  return `${variable} = ${serialize(value)}`
}
