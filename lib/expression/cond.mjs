import { declareOperatorError } from '../error.mjs'
import { isArray, isPlainObject, isUndefined } from '../util.mjs'

const OperatorError = declareOperatorError('$cond')

export function $cond (arg, compile) {
  const fns = parseCondition(arg).map(compile)

  return (doc, ctx) => {
    if (fns[0](doc, ctx) === true) {
      return fns[1](doc, ctx)
    } else {
      return fns[2](doc, ctx)
    }
  }
}

function parseCondition (arg) {
  if (isArray(arg)) {
    if (arg.length !== 3) {
      throw new OperatorError(
        'Operator $cond expects an array of three elements',
        { argument: arg }
      )
    }
    return arg
  } else if (isPlainObject(arg)) {
    if (isUndefined(arg.if) || isUndefined(arg.then) || isUndefined(arg.else)) {
      throw new OperatorError(
        'Operator $cond expects an object with "if", "then", and "else" properties',
        { argument: arg }
      )
    }
    return [arg.if, arg.then, arg.else]
  } else {
    throw new OperatorError(
      'Operator $cond expects an array or an object as argument',
      { argument: arg }
    )
  }
}
