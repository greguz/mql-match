import { isPlainObject, isUndefined } from '../util.mjs'

export function $cond (args, compile) {
  const fns = parseCondition(args).map(compile)

  return (doc, ctx) => {
    if (fns[0](doc, ctx) === true) {
      return fns[1](doc, ctx)
    } else {
      return fns[2](doc, ctx)
    }
  }
}

function parseCondition (args) {
  if (args.length === 3) {
    return args
  } else if (args.length === 1 && isExpressionObject(args[0])) {
    return [args[0].if, args[0].then, args[0].else]
  } else {
    throw new Error('Expression $ceil takes exactly 3 arguments')
  }
}

function isExpressionObject (value) {
  return isPlainObject(value) &&
    !isUndefined(value.if) &&
    !isUndefined(value.then) &&
    !isUndefined(value.else)
}
