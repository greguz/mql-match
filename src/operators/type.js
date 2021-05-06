const types = {
  double: 1,
  string: 2,
  object: 3,
  array: 4,
  objectId: 7,
  bool: 8,
  date: 9,
  null: 10,
  regex: 11,
  int: 16,
  long: 18,
  decimal: 19
}

function resolve (type) {
  if (typeof type === 'number') {
    for (const key of Object.keys(types)) {
      if (types[key] === type) {
        return key
      }
    }
  }
  return type
}

export function $type (variable, type) {
  switch (resolve(type)) {
    case 'decimal':
    case 'double':
      return `Number.isFinite(${variable})`
    case 'int':
    case 'long':
      return `Number.isInteger(${variable})`
    case 'string':
      return `typeof ${variable} === "string"`
    case 'object':
      return `typeof ${variable} === "object" && ${variable} !== null && Object.getPrototypeOf(${variable}) === Object.prototype`
    case 'array':
      return `Array.isArray(${variable})`
    case 'objectId':
      return `typeof Object(${variable}).toHexString === "function"`
    case 'bool':
      return `typeof ${variable} === "boolean"`
    case 'date':
      return `${variable} instanceof Date`
    case 'null':
      return `${variable} === null`
    case 'regex':
      return `${variable} instanceof RegExp`
    default:
      throw new Error(`Unknown BSON type "${type}"`)
  }
}
