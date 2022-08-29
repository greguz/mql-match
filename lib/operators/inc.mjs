import { _if, _isFinite, _isUndefined, _thrown } from '../code.mjs'
import { compileSubject } from '../subject.mjs'

export function $inc (subject, value) {
  if (!Number.isFinite(value)) {
    throw new Error(`Expected finite number to increment ${compileSubject(subject)}`)
  }

  const target = compileSubject(subject)
  return _if(
    {
      condition: _isUndefined(target),
      code: `${target} = ${value};`
    },
    {
      condition: _isFinite(target),
      code: `${target} += ${value};`
    },
    {
      code: _thrown('Cannot increment that value')
    }
  )
}
