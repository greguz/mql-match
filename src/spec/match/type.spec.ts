import test from 'ava'
import { Int32, Long } from 'bson'

import { compileMatch } from '../../exports.js'

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/exists/
 */
test('$exists', t => {
  const spices = [
    { saffron: 5, cinnamon: 5, mustard: null },
    { saffron: 3, cinnamon: null, mustard: 8 },
    { saffron: null, cinnamon: 3, mustard: 9 },
    { saffron: 1, cinnamon: 2, mustard: 3 },
    { saffron: 2, mustard: 5 },
    { saffron: 3, cinnamon: 2 },
    { saffron: 4 },
    { cinnamon: 2, mustard: 4 },
    { cinnamon: 2 },
    { mustard: 6 },
  ]

  // $exists: true
  {
    const match = compileMatch({ saffron: { $exists: true } })

    t.deepEqual(spices.filter(match), [
      { saffron: 5, cinnamon: 5, mustard: null },
      { saffron: 3, cinnamon: null, mustard: 8 },
      { saffron: null, cinnamon: 3, mustard: 9 },
      { saffron: 1, cinnamon: 2, mustard: 3 },
      { saffron: 2, mustard: 5 },
      { saffron: 3, cinnamon: 2 },
      { saffron: 4 },
    ])
  }

  // $exists: false
  {
    const match = compileMatch({ cinnamon: { $exists: false } })

    t.deepEqual(spices.filter(match), [
      { saffron: 2, mustard: 5 },
      { saffron: 4 },
      { mustard: 6 },
    ])
  }
})

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/type/
 */
test('$type', t => {
  const addressBook = [
    { _id: 1, address: '2030 Martian Way', zipCode: '90698345' },
    { _id: 2, address: '156 Lunar Place', zipCode: 43339374 },
    { _id: 3, address: '2324 Pluto Place', zipCode: Long.fromNumber(3921412) },
    { _id: 4, address: '55 Saturn Ring', zipCode: new Int32(88602117) },
    {
      _id: 5,
      address: '104 Venus Drive',
      zipCode: ['834847278', '1893289032'],
    },
  ]

  const grades = [
    { _id: 1, name: 'Alice King', classAverage: 87.33333333333333 },
    { _id: 2, name: 'Bob Jenkins', classAverage: '83.52' },
    { _id: 3, name: 'Cathy Hart', classAverage: '94.06' },
    { _id: 4, name: 'Drew Williams', classAverage: new Int32('93') },
  ]

  const sensorReading = [
    {
      _id: 1,
      readings: [
        25,
        23,
        ['Warn: High Temp!', 55],
        ['ERROR: SYSTEM SHUTDOWN!', 66],
      ],
    },
    { _id: 2, readings: [25, 25, 24, 23] },
    { _id: 3, readings: [22, 24, []] },
    { _id: 4, readings: [] },
    { _id: 5, readings: 24 },
  ]

  // Querying by Data Type
  {
    const match = compileMatch({ zipCode: { $type: 2 } })
    t.deepEqual(addressBook.filter(match), [
      { _id: 1, address: '2030 Martian Way', zipCode: '90698345' },
      {
        _id: 5,
        address: '104 Venus Drive',
        zipCode: ['834847278', '1893289032'],
      },
    ])
  }

  // Querying by Data Type
  {
    const match = compileMatch({ zipCode: { $type: 'string' } })
    t.deepEqual(addressBook.filter(match), [
      { _id: 1, address: '2030 Martian Way', zipCode: '90698345' },
      {
        _id: 5,
        address: '104 Venus Drive',
        zipCode: ['834847278', '1893289032'],
      },
    ])
  }

  // Querying by Data Type
  {
    const match = compileMatch({ zipCode: { $type: 1 } })
    t.deepEqual(addressBook.filter(match), [
      { _id: 2, address: '156 Lunar Place', zipCode: 43339374 },
    ])
  }

  {
    const match = compileMatch({ zipCode: { $type: 'double' } })
    t.deepEqual(addressBook.filter(match), [
      { _id: 2, address: '156 Lunar Place', zipCode: 43339374 },
    ])
  }

  // Querying by Data Type
  {
    const match = compileMatch({ zipCode: { $type: 'number' } })
    t.deepEqual(addressBook.filter(match), [
      { _id: 2, address: '156 Lunar Place', zipCode: 43339374 },
      {
        _id: 3,
        address: '2324 Pluto Place',
        zipCode: Long.fromNumber(3921412),
      },
      { _id: 4, address: '55 Saturn Ring', zipCode: new Int32(88602117) },
    ])
  }

  // Querying by Multiple Data Types
  {
    const match = compileMatch({ classAverage: { $type: [2, 1] } })
    t.deepEqual(grades.filter(match), [
      { _id: 1, name: 'Alice King', classAverage: 87.33333333333333 },
      { _id: 2, name: 'Bob Jenkins', classAverage: '83.52' },
      { _id: 3, name: 'Cathy Hart', classAverage: '94.06' },
    ])
  }

  // Querying by Multiple Data Types
  {
    const match = compileMatch({
      classAverage: { $type: ['string', 'double'] },
    })
    t.deepEqual(grades.filter(match), [
      { _id: 1, name: 'Alice King', classAverage: 87.33333333333333 },
      { _id: 2, name: 'Bob Jenkins', classAverage: '83.52' },
      { _id: 3, name: 'Cathy Hart', classAverage: '94.06' },
    ])
  }

  // Querying by Array Type
  {
    const match = compileMatch({ readings: { $type: 'array' } })
    t.deepEqual(sensorReading.filter(match), [
      {
        _id: 1,
        readings: [
          25,
          23,
          ['Warn: High Temp!', 55],
          ['ERROR: SYSTEM SHUTDOWN!', 66],
        ],
      },
      {
        _id: 2,
        readings: [25, 25, 24, 23],
      },
      {
        _id: 3,
        readings: [22, 24, []],
      },
      {
        _id: 4,
        readings: [],
      },
    ])
  }
})
