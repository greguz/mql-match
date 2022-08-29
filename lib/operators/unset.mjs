import { compileSubject } from '../subject.mjs'

export function $unset (subject) {
  return `delete ${compileSubject(subject)};`
}
