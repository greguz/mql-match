# mql-match

[![NPM Version](https://img.shields.io/npm/v/mql-match)](https://www.npmjs.com/package/mql-match)
[![NPM Dependency status](https://img.shields.io/librariesio/release/npm/mql-match)](https://www.npmjs.com/package/mql-match)
[![NPM Downloads](https://img.shields.io/npm/dm/mql-match)](https://www.npmjs.com/package/mql-match)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub last commit](https://img.shields.io/github/last-commit/greguz/mql-match)](https://github.com/greguz/mql-match)

This project is a MQL (MongoDB Query Language) compiler. Filter, Update, and Aggregation queries are supported. See the [support table](#supported-features) table for more info.

## Why

This project can be useful to mock some basic functionality of MongoDB's driver or simply using its query syntax for object matching.

## Example

```javascript
import { ObjectId } from 'bson' // or 'mongodb'
import {
  compileAggregationExpression,
  compileAggregationPipeline,
  compileFilterQuery,
  compileUpdateQuery
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

const map = compileAggregationExpression({
  _id: 0,
  item: 1,
  discount: {
    $cond: {
      if: { $gte: ['$qty', 250] },
      then: 30,
      else: 20
    }
  }
})

// logs { item: 'xyz1', discount: 30 }
console.log(map({ _id: 3, item: 'xyz1', qty: 250 }))

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
- [x] [`$gt`](https://www.mongodb.com/docs/manual/reference/operator/query/gt/)
- [x] [`$gte`](https://www.mongodb.com/docs/manual/reference/operator/query/gte/)
- [x] [`$in`](https://www.mongodb.com/docs/manual/reference/operator/query/in/)
- [x] [`$lt`](https://www.mongodb.com/docs/manual/reference/operator/query/lt/)
- [x] [`$lte`](https://www.mongodb.com/docs/manual/reference/operator/query/lte/)
- [x] [`$ne`](https://www.mongodb.com/docs/manual/reference/operator/query/ne/)
- [x] [`$nin`](https://www.mongodb.com/docs/manual/reference/operator/query/nin/)

#### Logical

- [x] [`$and`](https://www.mongodb.com/docs/manual/reference/operator/query/and/)
- [x] [`$not`](https://www.mongodb.com/docs/manual/reference/operator/query/not/)
- [x] [`$nor`](https://www.mongodb.com/docs/manual/reference/operator/query/nor/)
- [x] [`$or`](https://www.mongodb.com/docs/manual/reference/operator/query/or/)

#### Element

- [x] [`$exists`](https://www.mongodb.com/docs/manual/reference/operator/query/exists/)
- [x] [`$type`](https://www.mongodb.com/docs/manual/reference/operator/query/type/)

#### Evaluation

- [x] [`$expr`](https://www.mongodb.com/docs/manual/reference/operator/query/expr/)
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

- [x] [`$currentDate`](https://www.mongodb.com/docs/manual/reference/operator/update/currentDate/)
- [x] [`$inc`](https://www.mongodb.com/docs/manual/reference/operator/update/inc/)
- [x] [`$min`](https://www.mongodb.com/docs/manual/reference/operator/update/min/)
- [x] [`$max`](https://www.mongodb.com/docs/manual/reference/operator/update/max/)
- [x] [`$mul`](https://www.mongodb.com/docs/manual/reference/operator/update/mul/)
- [x] [`$rename`](https://www.mongodb.com/docs/manual/reference/operator/update/rename/)
- [x] [`$set`](https://www.mongodb.com/docs/manual/reference/operator/update/set/)
- [x] [`$setOnInsert`](https://www.mongodb.com/docs/manual/reference/operator/update/setOnInsert/)
- [x] [`$unset`](https://www.mongodb.com/docs/manual/reference/operator/update/unset/)

#### Array

- [ ] [`$`](https://www.mongodb.com/docs/manual/reference/operator/update/positional/)
- [ ] [`$[]`](https://www.mongodb.com/docs/manual/reference/operator/update/positional-all/)
- [ ] [`$[<identifier>]`](https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/)
- [x] [`$addToSet`](https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/)
- [x] [`$pop`](https://www.mongodb.com/docs/manual/reference/operator/update/pop/)
- [x] [`$pull`](https://www.mongodb.com/docs/manual/reference/operator/update/pull/)
- [x] [`$push`](https://www.mongodb.com/docs/manual/reference/operator/update/push/)
- [x] [`$pullAll`](https://www.mongodb.com/docs/manual/reference/operator/update/pullAll/)

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
- [x] [`$sort`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/)
- [ ] [`$sortByCount`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortByCount/)
- [ ] [`$unionWith`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unionWith/)
- [x] [`$unset`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unset/)
- [x] [`$unwind`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)

### [Aggregation Variables](https://www.mongodb.com/docs/manual/reference/aggregation-variables/)

- [x] `$$NOW`
- [x] `$$CLUSTER_TIME`
- [x] `$$ROOT`
- [ ] `$$CURRENT`
- [ ] `$$REMOVE`
- [ ] `$$DESCEND`
- [ ] `$$PRUNE`

### [Aggregation Pipeline Operators](https://www.mongodb.com/docs/manual/reference/operator/aggregation/)

Operators not listed here are currently not supported. Feel free to open an [GitHub Issue](https://github.com/greguz/mql-match/issues/new) if you need something in particular.

#### Arithmetic Expression Operators

- [x] [`$abs`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/abs/)
- [x] [`$add`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/add/)
- [x] [`$ceil`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ceil/)
- [x] [`$divide`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/divide/)
- [x] [`$exp`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/exp/)
- [x] [`$floor`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/floor/)
- [x] [`$ln`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ln/)
- [x] [`$log`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/log/)
- [x] [`$log10`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/log10/)
- [x] [`$mod`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/mod/)
- [x] [`$multiply`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/multiply/)
- [x] [`$pow`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/pow/)
- [x] [`$round`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/round/)
- [x] [`$sqrt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sqrt/)
- [x] [`$subtract`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/subtract/)
- [x] [`$trunc`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/trunc/)

#### Array Expression Operators

- [ ] [`$arrayElemAt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayElemAt/)
- [ ] [`$arrayToObject`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayToObject/)
- [x] [`$concatArrays`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/concatArrays/)
- [ ] [`$filter`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/filter/)
- [ ] [`$first`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/first/)
- [ ] [`$firstN`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/firstN/)
- [x] [`$in`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/in/)
- [ ] [`$indexOfArray`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexOfArray/)
- [x] [`$isArray`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isArray/)
- [ ] [`$last`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/last/)
- [ ] [`$lastN`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lastN/)
- [ ] [`$map`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/map/)
- [ ] [`$maxN`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/maxN/)
- [ ] [`$minN`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/minN/)
- [ ] [`$objectToArray`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/objectToArray/)
- [ ] [`$range`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/range/)
- [ ] [`$reduce`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/reduce/)
- [ ] [`$reverseArray`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/reverseArray/)
- [x] [`$size`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/size/)
- [ ] [`$slice`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/slice/)
- [ ] [`$sortArray`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortArray/)
- [ ] [`$zip`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/zip/)

#### Boolean Expression Operators

- [x] [`$and`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/and/)
- [x] [`$not`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/not/)
- [x] [`$or`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/or/)

#### Comparison Expression Operators

- [x] [`$cmp`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cmp/)
- [x] [`$eq`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/eq/)
- [x] [`$gt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/gt/)
- [x] [`$gte`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/gte/)
- [x] [`$lt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lt/)
- [x] [`$lte`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lte/)
- [x] [`$ne`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ne/)

#### Conditional Expression Operators

- [x] [`$cond`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cond/)
- [x] [`$ifNull`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ifNull/)
- [x] [`$switch`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/switch/)

#### Custom Aggregation Expression Operators

- [ ] [`$accumulator`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/accumulator/)
- [ ] [`$function`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/function/)

#### Data Size Operators

- [ ] [`$binarySize`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/binarySize/)
- [ ] [`$bsonSize`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/bsonSize/)

#### Date Expression Operators

- [ ] [`$dateAdd`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateAdd/)
- [ ] [`$dateDiff`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateDiff/)
- [ ] [`$dateFromParts`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateFromParts/)
- [ ] [`$dateFromString`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateFromString/)
- [ ] [`$dateSubtract`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateSubtract/)
- [ ] [`$dateToParts`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToParts/)
- [ ] [`$dateToString`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToString/)
- [ ] [`$dateTrunc`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateTrunc/)
- [ ] [`$dayOfMonth`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dayOfMonth/)
- [ ] [`$dayOfWeek`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dayOfWeek/)
- [ ] [`$dayOfYear`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dayOfYear/)
- [ ] [`$hour`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/hour/)
- [ ] [`$isoDayOfWeek`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isoDayOfWeek/)
- [ ] [`$isoWeek`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isoWeek/)
- [ ] [`$isoWeekYear`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isoWeekYear/)
- [ ] [`$millisecond`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/millisecond/)
- [ ] [`$minute`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/minute/)
- [ ] [`$month`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/month/)
- [ ] [`$second`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/second/)
- [ ] [`$toDate`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDate/)
- [ ] [`$week`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/week/)
- [ ] [`$year`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/year/)

#### Literal Expression Operator

- [x] [`$literal`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/literal/) No validation.

#### Miscellaneous Operators

- [ ] [`$getField`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/getField/)
- [ ] [`$rand`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/rand/)
- [ ] [`$sampleRate`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sampleRate/)

#### Object Expression Operators

- [ ] [`$mergeObjects`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/mergeObjects/)
- [ ] [`$objectToArray`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/objectToArray/)
- [ ] [`$setField`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setField/)

#### Set Expression Operators

- [ ] [`$allElementsTrue`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/allElementsTrue/)
- [ ] [`$anyElementTrue`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/anyElementTrue/)
- [ ] [`$setDifference`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setDifference/)
- [ ] [`$setEquals`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setEquals/)
- [ ] [`$setIntersection`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setIntersection/)
- [ ] [`$setIsSubset`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setIsSubset/)
- [ ] [`$setUnion`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/setUnion/)

#### String Expression Operators

- [ ] [`$concat`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/concat/)
- [ ] [`$dateFromString`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateFromString/)
- [ ] [`$dateToString`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/dateToString/)
- [ ] [`$indexOfBytes`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexOfBytes/)
- [ ] [`$indexOfCP`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexOfCP/)
- [ ] [`$ltrim`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/ltrim/)
- [ ] [`$regexFind`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/regexFind/)
- [ ] [`$regexFindAll`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/regexFindAll/)
- [ ] [`$regexMatch`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/regexMatch/)
- [ ] [`$replaceOne`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/replaceOne/)
- [ ] [`$replaceAll`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/replaceAll/)
- [ ] [`$rtrim`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/rtrim/)
- [ ] [`$split`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/split/)
- [ ] [`$strLenBytes`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenBytes/)
- [ ] [`$strLenCP`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/strLenCP/)
- [ ] [`$strcasecmp`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/strcasecmp/)
- [ ] [`$substr`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/substr/)
- [ ] [`$substrBytes`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/substrBytes/)
- [ ] [`$substrCP`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/substrCP/)
- [ ] [`$toLower`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLower/)
- [ ] [`$toString`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/)
- [ ] [`$trim`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/trim/)
- [ ] [`$toUpper`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toUpper/)

#### Text Expression Operator

- [ ] [`$meta`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/meta/)

#### Timestamp Expression Operators

- [ ] [`$tsIncrement`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsIncrement/)
- [ ] [`$tsSecond`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tsSecond/)

#### Trigonometry Expression Operators

- [ ] [`$sin`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sin/)
- [ ] [`$cos`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cos/)
- [ ] [`$tan`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tan/)
- [ ] [`$asin`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/asin/)
- [ ] [`$acos`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/acos/)
- [ ] [`$atan`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/atan/)
- [ ] [`$atan2`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/atan2/)
- [ ] [`$asinh`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/asinh/)
- [ ] [`$acosh`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/acosh/)
- [ ] [`$atanh`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/atanh/)
- [ ] [`$sinh`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sinh/)
- [ ] [`$cosh`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/cosh/)
- [ ] [`$tanh`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/tanh/)
- [ ] [`$degreesToRadians`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/degreesToRadians/)
- [ ] [`$radiansToDegrees`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/radiansToDegrees/)

#### Type Expression Operators

- [x] [`$convert`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/convert/)
- [x] [`$isNumber`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/isNumber/)
- [x] [`$toBool`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toBool/)
- [ ] [`$toDate`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDate/)
- [ ] [`$toDecimal`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDecimal/)
- [x] [`$toDouble`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toDouble/)
- [ ] [`$toInt`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toInt/)
- [ ] [`$toLong`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toLong/)
- [x] [`$toObjectId`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toObjectId/)
- [x] [`$toString`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/toString/)
- [x] [`$type`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/type/) Adds `"unknown"` type.

## Support

If this library helps you in your organization, you can show some love by giving the repo a star or support by making a nominal monetary contribution.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/greguz)
