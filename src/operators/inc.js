import { _if, _isFinite, _isUndefined, _thrown } from '../code.js'

export function $inc (variable, value) {
  if (!Number.isFinite(value)) {
    throw new Error()
  }

  return _if(
    {
      condition: _isUndefined(variable),
      code: `${variable} = ${value};`
    },
    {
      condition: _isFinite(variable),
      code: `${variable} += ${value};`
    },
    {
      code: _thrown('Cannot increment that value')
    }
  )
}
