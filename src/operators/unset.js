import { compileSubject } from '../subject.js'

export function $unset (subject) {
  return `delete ${compileSubject(subject)};`
}
