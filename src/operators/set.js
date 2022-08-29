import { compileSubject } from '../subject.js'

function compileValue (value, subject) {
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
    throw new Error(`Unsupported $set at ${compileSubject(subject)}`)
  }
}

export function $set (subject, value) {
  return `${compileSubject(subject)} = ${compileValue(value, subject)};`
}
