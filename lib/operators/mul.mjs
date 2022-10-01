import { _if, _isFinite, _isUndefined, _thrown } from '../code.mjs'
import { compileSubject } from '../subject.mjs'

export function $mul (subject, value) {
  if (!Number.isFinite(value)) {
    throw new Error(`Expected finite number to multiply ${compileSubject(subject)}`)
  }

  const target = compileSubject(subject)
  return _if(
    {
      condition: _isUndefined(target),
      code: `${target} = 0;`
    },
    {
      condition: _isFinite(target),
      code: `${target} *= ${value};`
    },
    {
      code: _thrown('Cannot multiply that value')
    }
  )
}
