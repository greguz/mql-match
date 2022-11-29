import Decimal from 'decimal.js'

import { isNumber, n } from '../bson.mjs'
import { isNullish } from '../util.mjs'

export function $log (args, compile) {
  if (args.length !== 2) {
    throw new Error('Expression $log takes exactly 2 arguments')
  }
  return build('$log', args, compile)
}

export function $log10 (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $log10 takes exactly 1 argument')
  }
  return build('$log10', [args[0], 10], compile)
}

export function $ln (args, compile) {
  if (args.length !== 1) {
    throw new Error('Expression $ln takes exactly 1 argument')
  }
  return build('$ln', [args[0], Math.E], compile)
}

function build (operator, args, compile) {
  const fns = args.map(compile)

  return (doc, ctx) => {
    const [value, base] = fns.map(fn => n(fn(doc, ctx)))

    if (isNullish(value) || isNullish(base)) {
      return null
    } else if (!isNumber(value) || !isNumber(base)) {
      throw new TypeError(`${operator}'s base must be numeric`)
    }

    switch (base) {
      case 2:
        return Decimal.log2(value).toNumber()
      case 10:
        return Decimal.log10(value).toNumber()
      case Math.E:
        return Decimal.ln(value).toNumber()
      default:
        return Decimal.log(value, base).toNumber()
    }
  }
}
