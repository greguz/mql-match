import { isTruthy } from '../bson.mjs'
import { isArray, isNullish, isPlainObject, isUndefined } from '../util.mjs'

export function $ifNull (args, compile) {
  if (args.length < 2) {
    throw new Error('Expression $ifNull needs at least two arguments')
  }

  const fns = args.map(compile)

  return (doc, ctx) => {
    for (const fn of fns) {
      const value = fn(doc, ctx)
      if (!isNullish(value)) {
        return value
      }
    }
    return null
  }
}

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

export function $switch (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $switch takes exactly 1 argument')
  }

  const obj = compileArgument(args[0], compile)

  return (doc, ctx) => {
    for (const branch of obj.branches) {
      if (isTruthy(branch.case(doc, ctx))) {
        return branch.then(doc, ctx)
      }
    }
    if (!obj.default) {
      throw new Error(
        'One cannot execute a switch statement where all the cases evaluate to false without a default'
      )
    }
    return obj.default(doc, ctx)
  }
}

function compileArgument (arg, compile) {
  if (!isPlainObject(arg)) {
    throw new TypeError('$switch requires an object as an argument')
  }
  if (!isArray(arg.branches)) {
    throw new TypeError("$switch expected an array for 'branches'")
  }
  if (arg.branches.length < 1) {
    throw new Error('$switch requires at least one branch')
  }
  return {
    branches: arg.branches.map(branch => compileBranch(branch, compile)),
    default: isUndefined(arg.default) ? undefined : compile(arg.default)
  }
}

function compileBranch (arg, compile) {
  if (!isPlainObject(arg)) {
    throw new TypeError('$switch expected each branch to be an object')
  }
  if (isUndefined(arg.case)) {
    throw new Error("$switch requires each branch have a 'case' expression")
  }
  if (isUndefined(arg.then)) {
    throw new Error("$switch requires each branch have a 'then' expression")
  }
  return {
    case: compile(arg.case),
    then: compile(arg.then)
  }
}
