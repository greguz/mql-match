import {
  BSON,
  getBSONType,
  getTypeAlias,
  getTypeWeight,
  isBinary,
  isDecimal128,
  isDouble,
  isInt32,
  isJavaScript,
  isLong,
  isMaxKey,
  isMinKey,
  isNumber,
  isObjectId,
  isReference,
  isRegExp,
  isSymbol,
  isTimestamp,
  n
} from './bson.mjs'
import {
  and,
  isArray,
  isBoolean,
  isDate,
  isNull,
  isNullish,
  isPlainObject,
  isString,
  isUndefined
} from './util.mjs'

export function eq (left, right) {
  return compileEq(right)(left)
}

export function gt (left, right) {
  return compileGt(right)(left)
}

export function gte (left, right) {
  return compileGte(right)(left)
}

export function lt (left, right) {
  return compileLt(right)(left)
}

export function lte (left, right) {
  return compileLte(right)(left)
}

export function ne (left, right) {
  return !eq(left, right)
}

/**
 * Compiles an equality function against the argument.
 */
export function compileEq (right) {
  const type = getBSONType(right)

  switch (type) {
    case BSON.Null:
    case BSON.Undefined:
      return isNullish
    case BSON.Boolean:
    case BSON.String:
      return left => left === right
    case BSON.MinKey:
      return isMinKey
    case BSON.MaxKey:
      return isMaxKey
    case BSON.Date: {
      const date = right.toISOString()
      return left => isDate(left) && left.toISOString() === date
    }
    case BSON.ObjectId: {
      const id = right.toHexString()
      return left => isObjectId(left) && left.toHexString() === id
    }
    case BSON.Timestamp: {
      const low = right.low
      const high = right.high
      return left => isTimestamp(left) && left.low === low && left.high === high
    }
    case BSON.Decimal128: {
      const decimal = n(right)
      return left => isDecimal128(left) && n(left) === decimal
    }
    case BSON.Double: {
      const double = n(right)
      return left => isDouble(left) && n(left) === double
    }
    case BSON.Int32: {
      const int = n(right)
      return left => isInt32(left) && n(left) === int
    }
    case BSON.Long: {
      const long = n(right)
      return left => isLong(left) && n(left) === long
    }
    case BSON.Symbol: {
      const symbol = right.valueOf()
      return left => isSymbol(left) && left.valueOf() === symbol
    }
    case BSON.Array:
      return compileEqArray(right)
    case BSON.Object:
      return compileEqObject(right)
    default:
      throw new Error(`Unsupported equality for ${getTypeAlias(type)} type`)
  }
}

function compileEqArray (right) {
  const fns = right.map((item, index) => {
    const fn = compileEq(item)
    return left => fn(left[index])
  })

  const match = and(fns)
  return left => isArray(left) && left.length === right.length && match(left)
}

function compileEqObject (right) {
  const fns = Object.keys(right).map(key => {
    const fn = compileEq(right[key])
    return left => fn(left[key])
  })

  const match = and(fns)
  return left => isPlainObject(left) && match(left)
}

/**
 * Compiles a "greater than" function against the argument.
 * The argument is the "right" argument.
 */
export function compileGt (vRight) {
  const tRight = getBSONType(vRight)
  const wRight = getTypeWeight(tRight)

  const greaterThan = compileGtType(vRight, tRight)
  if (!greaterThan) {
    return vLeft => getTypeWeight(getBSONType(vLeft)) > wRight
  }

  return vLeft => {
    const tLeft = getBSONType(vLeft)
    return tLeft === tRight
      ? greaterThan(vLeft, tLeft)
      : getTypeWeight(tLeft) > wRight
  }
}

export function compileGte (vRight) {
  const tRight = getBSONType(vRight)
  const wRight = getTypeWeight(tRight)

  const greaterThan = compileGtType(vRight, tRight)
  if (!greaterThan) {
    return vLeft => getTypeWeight(getBSONType(vLeft)) >= wRight
  }

  const equals = compileEq(vRight)
  return vLeft => greaterThan(vLeft) || equals(vLeft)
}

function compileGtType (right, type) {
  switch (type) {
    case BSON.Decimal128:
    case BSON.Double:
    case BSON.Int32:
    case BSON.Long: {
      const number = n(right)
      return left => left > number
    }
    case BSON.String:
      return left => left > right
    case BSON.Symbol: {
      const symbol = right.valueOf()
      return left => left.valueOf() > symbol
    }
    case BSON.ObjectId: {
      const date = right.getTimestamp()
      return left => left.getTimestamp() > date
    }
    case BSON.Boolean:
      return left => left === true && right === false
    case BSON.Date: {
      const iso = right.toISOString()
      return left => left.toISOString() > iso
    }
  }
}

export function compileLt (vRight) {
  const tRight = getBSONType(vRight)
  const wRight = getTypeWeight(tRight)

  const lesserThan = compileLtType(vRight, tRight)
  if (!lesserThan) {
    return vLeft => getTypeWeight(getBSONType(vLeft)) < wRight
  }

  return vLeft => {
    const tLeft = getBSONType(vLeft)
    return tLeft === tRight
      ? lesserThan(vLeft, tLeft)
      : getTypeWeight(tLeft) < wRight
  }
}

export function compileLte (vRight) {
  const tRight = getBSONType(vRight)
  const wRight = getTypeWeight(tRight)

  const lesserThan = compileLtType(vRight, tRight)
  if (!lesserThan) {
    return vLeft => getTypeWeight(getBSONType(vLeft)) <= wRight
  }

  const equals = compileEq(vRight)
  return vLeft => lesserThan(vLeft) || equals(vLeft)
}

function compileLtType (right, type) {
  switch (type) {
    case BSON.Decimal128:
    case BSON.Double:
    case BSON.Int32:
    case BSON.Long: {
      const number = n(right)
      return left => left < number
    }
    case BSON.String:
      return left => left < right
    case BSON.Symbol: {
      const symbol = right.valueOf()
      return left => left.valueOf() < symbol
    }
    case BSON.ObjectId: {
      const date = right.getTimestamp()
      return left => left.getTimestamp() < date
    }
    case BSON.Boolean:
      return left => left === false && right === true
    case BSON.Date: {
      const iso = right.toISOString()
      return left => left.toISOString() < iso
    }
  }
}

export function compileType (type) {
  switch (type) {
    case BSON.Double:
    case 'double':
      return isDouble
    case BSON.String:
    case 'string':
      return isString
    case BSON.Object:
    case 'object':
      return isPlainObject
    case BSON.Array:
    case 'array':
      return isArray
    case BSON.Binary:
    case 'binData':
      return isBinary
    case BSON.Undefined:
    case 'undefined':
      return isUndefined
    case BSON.ObjectId:
    case 'objectId':
      return isObjectId
    case BSON.Boolean:
    case 'bool':
      return isBoolean
    case BSON.Date:
    case 'date':
      return isDate
    case BSON.Null:
    case 'null':
      return isNull
    case BSON.RegExp:
    case 'regex':
      return isRegExp
    case BSON.Reference:
    case 'dbPointer':
      return isReference
    case BSON.JavaScript:
    case 'javascript':
      return isJavaScript
    case BSON.Symbol:
    case 'symbol':
      return isSymbol
    case BSON.Int32:
    case 'int':
      return isInt32
    case BSON.Timestamp:
    case 'timestamp':
      return isTimestamp
    case BSON.Long:
    case 'long':
      return isLong
    case BSON.Decimal128:
    case 'decimal':
      return isDecimal128
    case BSON.MinKey:
    case 'minKey':
      return isMinKey
    case BSON.MaxKey:
    case 'maxKey':
      return isMaxKey
    case 'number':
      return isNumber
    default:
      throw new Error(`Unsupported type match for ${type}`)
  }
}
