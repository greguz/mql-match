import { compileDeleter, compileReader, compileWriter } from '../path.mjs'

export function $rename (oldKey, newKey) {
  const readValue = compileReader(oldKey)
  const writeValue = compileWriter(newKey)
  const deleteValue = compileDeleter(oldKey)
  return document => {
    const value = readValue(document)
    if (value !== undefined) {
      writeValue(document, value)
      deleteValue(document)
    }
  }
}
