import { compileDeleter } from '../path.mjs'

export function $unset (key, value) {
  if (value !== '') {
    throw new Error()
  }
  const deleteValue = compileDeleter(key)
  return document => {
    deleteValue(document)
  }
}
