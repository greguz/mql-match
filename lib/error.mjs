export class MqlError extends Error {
  constructor (code, message, info) {
    super(message)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.name = 'MqlError'
    this.code = code || 'MQL_ERROR'
    if (typeof info === 'object' && info !== null) {
      for (const key of Object.keys(info)) {
        this[key] = info[key]
      }
    }
  }

  get [Symbol.toStringTag] () {
    return 'Error'
  }

  toString () {
    return `${this.name} [${this.code}]: ${this.message}`
  }
}

export function declareOperatorError (operator) {
  return class MqlOperatorError extends MqlError {
    constructor (message, info = {}) {
      super(
        info.document !== undefined
          ? 'MQL_OPERATOR_INVALID_DOCUMENT'
          : 'MQL_OPERATOR_INVALID_ARGUMENT',
        message,
        { operator, ...info }
      )
    }
  }
}
