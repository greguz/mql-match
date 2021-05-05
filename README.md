# mql-match

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
