import { Timestamp } from 'bson'

import { compileWriter } from '../path.mjs'

export function $currentDate (key, arg) {
  const write = compileWriter(key)

  if (arg === true || Object(arg).$type === 'date') {
    return document => write(
      document,
      new Date()
    )
  } else if (Object(arg).$type === 'timestamp') {
    return document => write(
      document,
      Timestamp.fromNumber(Date.now() / 1000)
    )
  } else {
    throw new Error('Operator $currentDate has found an invalid argument')
  }
}
