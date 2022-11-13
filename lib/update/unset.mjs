import { compileDeleter } from '../path.mjs'

export function $unset (key, value) {
  if (value !== '') {
    throw new Error('Operator $unset expects an empty string')
  }
  const deleteValue = compileDeleter(key)
  return document => {
    deleteValue(document)
  }
}
