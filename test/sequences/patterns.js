const test = require ('ava')

import { 
    getPatternTimeDivision, getPatternEvents, pattern
  } from '../../src/sequences/patterns.js'

import { mc, off, on } from '../../src/messages/messages.js'
import {
    barEvent, beatEvent, restEvent, subdivisionEvent
  } from '../../src/messages/frmeta.js'

test ('getPatternTimeDivision 1', (t) => {
  t.is (3, getPatternTimeDivision ([0, 1, 2])) 
})

test ('getPatternTimeDivision 2', (t) => {
  t.is (6, getPatternTimeDivision ([0, [1, 2], [3, 4]]))
})

test ('getPatternTimeDivision 3', (t) => {
  t.is (12, getPatternTimeDivision ([0, [1, [2, 3]], 4]))
})

test ('getPatternTimeDivision 4', (t) => {
  t.is (24, getPatternTimeDivision ([0, 1, [2, 3], [4, 5, 6]]))
})

test ('getPatternEvents', (t) => {
  t.deepEqual (
    getPatternEvents (3, [on (0), on (1), on (2)]),
    [
      on (0, 96), off (0, 96, 0, 0, 1),
      on (1, 96), off (1, 96, 0, 0, 1),
      on (2, 96), off (2, 96, 0, 0, 1) 
    ])

  t.deepEqual (
    getPatternEvents (6, [on (0), [on (1), on (2)], [on (3), on (4)]]),
    [
      on (0, 96), off (0, 96, 0, 0, 2),
      on (1, 96), off (1, 96, 0, 0, 1),
      on (2, 96), off (2, 96, 0, 0, 1),
      on (3, 96), off (3, 96, 0, 0, 1),
      on (4, 96), off (4, 96, 0, 0, 1)
    ])

  t.deepEqual (
    getPatternEvents (3, [mc (), mc (), mc ()]),
    [
      mc (0, 0),
      mc (0, 1),
      mc (0, 1)
    ])

  t.deepEqual (
    getPatternEvents (6, [beatEvent (), restEvent (), subdivisionEvent (), beatEvent (), subdivisionEvent (), restEvent ()]),
    [
      beatEvent (),
      restEvent (0, 1),
      subdivisionEvent (0, 1),
      beatEvent (0, 1),
      subdivisionEvent (0, 1),
      restEvent (0, 1)
    ])

})

test ('pattern', (t) => {
  t.deepEqual (
    pattern ([on (0), on (1), on (2)]),
    [[
      on (0, 96), off (0, 96, 0, 0, 1),
      on (1, 96), off (1, 96, 0, 0, 1),
      on (2, 96), off (2, 96, 0, 0, 1)
    ], 3])

  t.deepEqual (
    pattern ([on (0), [on (1), on (2)], [on (3), on (4)]]),
    [[
      on (0, 96), off (0, 96, 0, 0, 2),
      on (1, 96), off (1, 96, 0, 0, 1),
      on (2, 96), off (2, 96, 0, 0, 1),
      on (3, 96), off (3, 96, 0, 0, 1),
      on (4, 96), off (4, 96, 0, 0, 1)
    ], 6])

  t.deepEqual (
    pattern ([mc (), mc (), mc ()]),
    [[
      mc (0, 0),
      mc (0, 1),
      mc (0, 1)
    ], 3])

  t.deepEqual (
    pattern ([beatEvent (), restEvent (), subdivisionEvent (), beatEvent (), subdivisionEvent (), restEvent ()]),
    [[
      beatEvent (),
      restEvent (0, 1),
      subdivisionEvent (0, 1),
      beatEvent (0, 1),
      subdivisionEvent (0, 1),
      restEvent (0, 1)
    ], 6])
})
