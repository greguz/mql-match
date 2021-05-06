# mql-match

This project compiles a valid [MQL](https://docs.mongodb.com/manual/tutorial/query-documents/) (MongoDB Query Language) query to a native JavaScript matching function. It uses code generation technics to
improve matching performance.

MongoDB's field reference resolution is fully supported.

Currently, only common operators are supported. Down here, there's a support chart. Future updates will bring support to other operators.

## [Operators](https://docs.mongodb.com/manual/reference/operator/query/) support

### Comparison

- [x] `$eq` Object match not supported.
- [x] `$gt` Numbers, dates, and strings only.
- [x] `$gte` Numbers, dates, and strings only.
- [x] `$in` Same as `$eq` operator.
- [x] `$lt` Numbers, dates, and strings only.
- [x] `$lte` Numbers, dates, and strings only.
- [x] `$ne` Same as `$eq` operator.
- [x] `$nin` Same as `$eq` operator.

### Logical

- [x] `$and`
- [x] `$not`
- [x] `$nor`
- [x] `$or`

### Element

- [x] `$exists` Check if value is `undefined`.
- [x] `$type` Some uncommon types are not supported.

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

- [ ] `$comment`
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
