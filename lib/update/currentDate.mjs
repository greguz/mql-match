import { declareOperatorError } from '../error.mjs'
import { compileWriter } from '../path.mjs'
import { isOperatorExpression } from '../util.mjs'

const OperatorError = declareOperatorError('$currentDate')

export function $currentDate (key, arg) {
  if (!isDate(arg)) {
    throw new OperatorError(
      'Operator $currentDate supports only date values at the moment',
      { argument: arg }
    )
  }

  const write = compileWriter(key)

  return document => {
    write(document, new Date())
  }
}

function isDate (value) {
  if (value === true) {
    return true
  } else if (isOperatorExpression(value)) {
    return value.$type === 'date'
  } else {
    return false
  }
}
