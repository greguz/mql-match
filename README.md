# mql-match

[![npm version](https://badge.fury.io/js/mql-match.svg)](https://badge.fury.io/js/mql-match)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/mql-match)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This project compiles a valid [MQL](https://docs.mongodb.com/manual/tutorial/query-documents/) (MongoDB Query Language) query to a native JavaScript matching function.

## Why

This project can be useful to mock some basic functionality of MongoDB's driver or simply using its query syntax for object matching.

## Operators support

### [Query Operators](https://docs.mongodb.com/manual/reference/operator/query/)

#### Comparison

- [x] [`$eq`](https://www.mongodb.com/docs/manual/reference/operator/query/eq/)
- [x] [`$gt`](https://www.mongodb.com/docs/manual/reference/operator/query/gt/) Numbers, dates, and strings **only**.
- [x] [`$gte`](https://www.mongodb.com/docs/manual/reference/operator/query/gte/) Numbers, dates, and strings **only**.
- [x] [`$in`](https://www.mongodb.com/docs/manual/reference/operator/query/in/)
- [x] [`$lt`](https://www.mongodb.com/docs/manual/reference/operator/query/lt/) Numbers, dates, and strings **only**.
- [x] [`$lte`](https://www.mongodb.com/docs/manual/reference/operator/query/lte/) Numbers, dates, and strings **only**.
- [x] [`$ne`](https://www.mongodb.com/docs/manual/reference/operator/query/ne/)
- [x] [`$nin`](https://www.mongodb.com/docs/manual/reference/operator/query/nin/)

#### Logical

- [x] [`$and`](https://www.mongodb.com/docs/manual/reference/operator/query/and/)
- [x] [`$not`](https://www.mongodb.com/docs/manual/reference/operator/query/not/)
- [x] [`$nor`](https://www.mongodb.com/docs/manual/reference/operator/query/nor/)
- [x] [`$or`](https://www.mongodb.com/docs/manual/reference/operator/query/or/)

#### Element

- [x] [`$exists`](https://www.mongodb.com/docs/manual/reference/operator/query/exists/)
- [x] [`$type`](https://www.mongodb.com/docs/manual/reference/operator/query/type/) Types `"binData"`, `"dbPointer"`, `"javascript"`, `"javascriptWithScope"`, `"timestamp"`, `"minKey"`, and `"maxKey"` are **not** supported.

#### Evaluation

- [ ] [`$expr`](https://www.mongodb.com/docs/manual/reference/operator/query/expr/)
- [ ] [`$jsonSchema`](https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/)
- [x] [`$mod`](https://www.mongodb.com/docs/manual/reference/operator/query/mod/)
- [x] [`$regex`](https://www.mongodb.com/docs/manual/reference/operator/query/regex/)
- [ ] [`$text`](https://www.mongodb.com/docs/manual/reference/operator/query/text/)
- [ ] [`$where`](https://www.mongodb.com/docs/manual/reference/operator/query/where/)

#### Geospatial

- [ ] [`$geoIntersects`](https://www.mongodb.com/docs/manual/reference/operator/query/geoIntersects/)
- [ ] [`$geoWithin`](https://www.mongodb.com/docs/manual/reference/operator/query/geoWithin/)
- [ ] [`$near`](https://www.mongodb.com/docs/manual/reference/operator/query/near/)
- [ ] [`$nearSphere`](https://www.mongodb.com/docs/manual/reference/operator/query/nearSphere/)

#### Array

- [x] [`$all`](https://www.mongodb.com/docs/manual/reference/operator/query/all/)
- [x] [`$elemMatch`](https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/)
- [x] [`$size`](https://www.mongodb.com/docs/manual/reference/operator/query/size/)

#### Bitwise

- [ ] [`$bitsAllClear`](https://www.mongodb.com/docs/manual/reference/operator/query/bitsAllClear/)
- [ ] [`$bitsAllSet`](https://www.mongodb.com/docs/manual/reference/operator/query/bitsAllSet/)
- [ ] [`$bitsAnyClear`](https://www.mongodb.com/docs/manual/reference/operator/query/bitsAnyClear/)
- [ ] [`$bitsAnySet`](https://www.mongodb.com/docs/manual/reference/operator/query/bitsAnySet/)

#### Projection

- [ ] [`$`](https://www.mongodb.com/docs/manual/reference/operator/projection/positional/)
- [ ] [`$elemMatch`](https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/)
- [ ] [`$meta`](https://www.mongodb.com/docs/manual/reference/operator/query/meta/)
- [ ] [`$slice`](https://www.mongodb.com/docs/manual/reference/operator/query/slice/)

#### Miscellaneous

- [x] [`$comment`](https://www.mongodb.com/docs/manual/reference/operator/query/comment/) Stub.
- [ ] [`$rand`](https://www.mongodb.com/docs/manual/reference/operator/query/rand/)

### [Update Operators](https://www.mongodb.com/docs/manual/reference/operator/update/)

#### Fields

- [ ] [`$currentDate`](https://www.mongodb.com/docs/manual/reference/operator/update/currentDate/)
- [x] [`$inc`](https://www.mongodb.com/docs/manual/reference/operator/update/inc/)
- [ ] [`$min`](https://www.mongodb.com/docs/manual/reference/operator/update/min/)
- [ ] [`$max`](https://www.mongodb.com/docs/manual/reference/operator/update/max/)
- [x] [`$mul`](https://www.mongodb.com/docs/manual/reference/operator/update/mul/)
- [x] [`$rename`](https://www.mongodb.com/docs/manual/reference/operator/update/rename/)
- [x] [`$set`](https://www.mongodb.com/docs/manual/reference/operator/update/set/)
- [x] [`$setOnInsert`](https://www.mongodb.com/docs/manual/reference/operator/update/setOnInsert/)
- [x] [`$unset`](https://www.mongodb.com/docs/manual/reference/operator/update/unset/)

#### Array

- [ ] [`$`](https://www.mongodb.com/docs/manual/reference/operator/update/positional/)
- [ ] [`$[]`](https://www.mongodb.com/docs/manual/reference/operator/update/positional-all/)
- [ ] [`$[<identifier>]`](https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/)
- [ ] [`$addToSet`](https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/)
- [x] [`$pop`](https://www.mongodb.com/docs/manual/reference/operator/update/pop/)
- [x] [`$pull`](https://www.mongodb.com/docs/manual/reference/operator/update/pull/)
- [ ] [`$push`](https://www.mongodb.com/docs/manual/reference/operator/update/push/)
- [ ] [`$pullAll`](https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/)

#### Modifiers

- [ ] [`$each`](https://www.mongodb.com/docs/manual/reference/operator/update/each/)
- [ ] [`$position`](https://www.mongodb.com/docs/manual/reference/operator/update/position/)
- [ ] [`$slice`](https://www.mongodb.com/docs/manual/reference/operator/update/slice/)
- [ ] [`$sort`](https://www.mongodb.com/docs/manual/reference/operator/update/sort/)

#### Bitwise

- [ ] [`$bit`](https://www.mongodb.com/docs/manual/reference/operator/update/bit/)

## Example

```javascript
import { ObjectId } from 'mongodb'
import { compileFilterQuery, compileUpdateQuery } from 'mql-match'

const match = compileFilterQuery({
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
