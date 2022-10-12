import { deleteValue, parsePath } from '../path.mjs'

export function $unset (key, value) {
  if (value !== '') {
    throw new Error()
  }
  const path = parsePath(key)
  return document => {
    deleteValue(document, path)
  }
}
