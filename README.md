# mql-match

[![npm version](https://badge.fury.io/js/mql-match.svg)](https://badge.fury.io/js/mql-match)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/mql-match)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This project is a MQL (MongoDB Query Language) compiler. Filter, Update, and Aggregation queries are supported. See the [support table](#supported-features) table for more info.

## Why

This project can be useful to mock some basic functionality of MongoDB's driver or simply using its query syntax for object matching.

## Example

```javascript
import { ObjectId } from 'bson' // or 'mongodb'
import {
  compileFilterQuery,
  compileUpdateQuery,
  compileAggregationPipeline
} from 'mql-match'

const documents = [
  {
    _id: new ObjectId("507f1f77bcf86cd799439011"),
    value: 130
  },
  {
    _id: new ObjectId("507f191e810c19729de860ea"),
    value: 42
  }
]

const match = compileFilterQuery({
  _id: new ObjectId("507f1f77bcf86cd799439011")
})

// logs { _id: new ObjectId("507f1f77bcf86cd799439011"), value: 130 }
console.log(documents.find(match))

const update = compileUpdateQuery({
  $setOnInsert: {
    hello: 'World'
  },
  $set: {
    my: 'Pleasure'
  }
})

const oldObject = { _id: "my_doc" }
update(oldObject)
// logs { _id: 'my_doc', my: 'Pleasure' }
console.log(oldObject)

const newObject = {}
// the `true` say that this document was inserted
update(newObject, true)
// logs { _id: new ObjectId("xxxxxxxxxxxxxxxxxxxxxxxx"), hello: 'World', my: 'Pleasure' }
console.log(newObject)

// Returns a function that accepts an iterable (both sync or async) and returns an async iterable
const aggregate = compileAggregationPipeline([
  {
    $match: {
      value: 42
    }
  }
])

async function pipelineExample () {
  // logs { _id: new ObjectId("507f191e810c19729de860ea"), value: 42 }
  for await (const document of aggregate(documents)) {
    console.log(document)
  }
}

pipelineExample().catch(err => console.error(err))
```

## Supported features

### [Query Operators](https://docs.mongodb.com/manual/reference/operator/query/)

#### Comparison

- [x] [`$eq`](https://www.mongodb.com/docs/manual/reference/operator/query/eq/)
- [x] [`$gt`](https://www.mongodb.com/docs/manual/reference/operator/query/gt/) Uses a simple `>` compare when types are matching.
- [x] [`$gte`](https://www.mongodb.com/docs/manual/reference/operator/query/gte/) Uses a simple `>=` compare when types are matching.
- [x] [`$in`](https://www.mongodb.com/docs/manual/reference/operator/query/in/)
- [x] [`$lt`](https://www.mongodb.com/docs/manual/reference/operator/query/lt/) Uses a simple `<` compare when types are matching.
- [x] [`$lte`](https://www.mongodb.com/docs/manual/reference/operator/query/lte/) Uses a simple `<=` compare when types are matching.
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
- [ ] [`$elemMatch`](https://www.mongodb.com/docs/manual/reference/operator/projection/elemMatch/)
- [ ] [`$meta`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/meta/)
- [ ] [`$slice`](https://www.mongodb.com/docs/manual/reference/operator/projection/slice/)

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
- [x] [`$push`](https://www.mongodb.com/docs/manual/reference/operator/update/push/)
- [ ] [`$pullAll`](https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/)

#### Modifiers

- [x] [`$each`](https://www.mongodb.com/docs/manual/reference/operator/update/each/)
- [x] [`$position`](https://www.mongodb.com/docs/manual/reference/operator/update/position/)
- [x] [`$slice`](https://www.mongodb.com/docs/manual/reference/operator/update/slice/)
- [x] [`$sort`](https://www.mongodb.com/docs/manual/reference/operator/update/sort/) Limited to a single field.

#### Bitwise

- [ ] [`$bit`](https://www.mongodb.com/docs/manual/reference/operator/update/bit/)

### [Aggregation Pipeline Stages](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/#alphabetical-listing-of-stages)

- [x] [`$addFields`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/addFields/)
- [ ] [`$bucket`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/bucket/)
- [ ] [`$bucketAuto`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/bucketAuto/)
- [ ] [`$changeStream`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/changeStream/)
- [ ] [`$collStats`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/collStats/)
- [x] [`$count`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/count/)
- [ ] [`$currentOp`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/currentOp/)
- [ ] [`$densify`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/densify/)
- [ ] [`$documents`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/documents/)
- [ ] [`$facet`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/)
- [ ] [`$fill`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/fill/)
- [ ] [`$geoNear`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/geoNear/)
- [ ] [`$graphLookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/graphLookup/)
- [ ] [`$group`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/)
- [ ] [`$indexStats`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexStats/)
- [x] [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/)
- [ ] [`$listLocalSessions`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/listLocalSessions/)
- [ ] [`$listSessions`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/listSessions/)
- [ ] [`$lookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)
- [x] [`$match`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/)
- [ ] [`$merge`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/merge/)
- [ ] [`$out`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/)
- [ ] [`$planCacheStats`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/planCacheStats/)
- [x] [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/)
- [ ] [`$redact`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/redact/)
- [ ] [`$replaceRoot`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/replaceRoot/)
- [ ] [`$replaceWith`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/replaceWith/)
- [ ] [`$sample`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sample/)
- [ ] [`$search`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/search/)
- [ ] [`$searchMeta`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/searchMeta/)
- [x] [`$set`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/set/)
- [ ] [`$setWindowFields`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setWindowFields/)
- [x] [`$skip`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/skip/)
- [ ] [`$sort`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/)
- [ ] [`$sortByCount`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortByCount/)
- [ ] [`$unionWith`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unionWith/)
- [x] [`$unset`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unset/)
- [x] [`$unwind`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)

### [Aggregation Pipeline Operators](https://www.mongodb.com/docs/manual/reference/operator/aggregation/)

#### Arithmetic Expression Operators

- [x] [$abs](https://www.mongodb.com/docs/manual/reference/operator/aggregation/abs/)
- [x] [$add](https://www.mongodb.com/docs/manual/reference/operator/aggregation/add/)
- [x] [$ceil](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/)
- [x] [$divide](https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/)
- [x] [$exp](https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/)
- [x] [$floor](https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/)
- [x] [$ln](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ln/)
- [x] [$log](https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/)
- [x] [$log10](https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/)
- [x] [$mod](https://www.mongodb.com/docs/manual/reference/operator/aggregation/mod/)
- [x] [$multiply](https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/)
- [x] [$pow](https://www.mongodb.com/docs/manual/reference/operator/aggregation/pow/)
- [x] [$round](https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/) Negative `place` is unstable.
- [x] [$sqrt](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/)
- [x] [$subtract](https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/)
- [x] [$trunc](https://www.mongodb.com/docs/manual/reference/operator/aggregation/trunc/)

#### Literal Expression Operator

- [x] [$literal](https://www.mongodb.com/docs/manual/reference/operator/aggregation/literal/)

## Support

If this library helps you in your organization, you can show some love by giving the repo a star or support by making a nominal monetary contribution.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/greguz)
