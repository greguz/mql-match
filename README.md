# mql-match

[![npm version](https://badge.fury.io/js/mql-match.svg)](https://badge.fury.io/js/mql-match)
[![Dependencies Status](https://david-dm.org/greguz/mql-match.svg)](https://david-dm.org/greguz/mql-match.svg)

This project compiles a valid [MQL](https://docs.mongodb.com/manual/tutorial/query-documents/) (MongoDB Query Language) query to a native JavaScript matching function. It uses code generation technics to
improve matching performance.

## Why

This project can be useful to mock some basic functionality of MongoDB's driver or simply using its query syntax for object matching.

## [Operators](https://docs.mongodb.com/manual/reference/operator/query/) support

Currently, not all operators are supported. Future updates will bring support for more operators.

### Comparison

- [x] `$eq`
- [x] `$gt` Numbers, dates, and strings only.
- [x] `$gte` Numbers, dates, and strings only.
- [x] `$in`
- [x] `$lt` Numbers, dates, and strings only.
- [x] `$lte` Numbers, dates, and strings only.
- [x] `$ne`
- [x] `$nin`

### Logical

- [x] `$and`
- [x] `$not`
- [x] `$nor`
- [x] `$or`

### Element

- [x] `$exists`
- [x] `$type` Types `"binData"`, `"dbPointer"`, `"javascript"`, `"javascriptWithScope"`, `"timestamp"`, `"minKey"`, and `"maxKey"` are **not** supported.

### Evaluation

- [ ] `$expr`
- [ ] `$jsonSchema`
- [x] `$mod`
- [x] `$regex`
- [ ] `$text`
- [ ] `$where`

### Geospatial

- [ ] `$geoIntersects`
- [ ] `$geoWithin`
- [ ] `$near`
- [ ] `$nearSphere`

### Array

- [x] `$all`
- [x] `$elemMatch`
- [x] `$size`

### Bitwise

- [ ] `$bitsAllClear`
- [ ] `$bitsAllSet`
- [ ] `$bitsAnyClear`
- [ ] `$bitsAnySet`

### Projection

- [ ] `$`
- [ ] `$elemMatch`
- [ ] `$meta`
- [ ] `$slice`

### Miscellaneous

- [x] `$comment` Stub.
- [ ] `$rand`

## Example

```javascript
import { ObjectId } from 'mongodb'
import { compile } from 'mql-match'

const match = compile({
  value: {
    $in: [42, 130]
  }
})

const documents = [
  {
    _id: new ObjectId(),
    value: 130
  },
  {
    _id: new ObjectId(),
    value: 0
  },
  {
    _id: new ObjectId(),
    value: 42
  }
]

for (const document of documents) {
  if (match(document)) {
    console.log(document._id) // will log 2 documents
  }
}
```
