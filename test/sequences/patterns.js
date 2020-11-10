const test = require ('ava')
import { 
    getPatternTimeDivision, getPatternEvents, pattern
  } from '../../src/sequences/patterns.js'
import { mc, off, on } from '../../src/messages/messages.js'
import { endOfTrack } from '../../src/messages/meta.js'
import {
    barEvent, beatEvent, restEvent, subdivisionEvent
  } from '../../src/messages/frmeta.js'
import { absoluteDeltaTime, deltaTime } from '../../src/lenses/lenses.js'
import { set } from 'ramda'

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

test ('getPatternTimeDivision (with endOfTrack)', (t) => {
  t.is (3, getPatternTimeDivision ([0, 1, endOfTrack ()]))
})

test ('getPatternEvents', (t) => {
  t.deepEqual (
    getPatternEvents (3, [on (0), on (1), on (2)]),
    [
      set (absoluteDeltaTime) (0) (on (0, 96)), 
      set (absoluteDeltaTime) (1) (off (0, 96)),
      set (absoluteDeltaTime) (1) (on (1, 96)), 
      set (absoluteDeltaTime) (2) (off (1, 96)),
      set (absoluteDeltaTime) (2) (on (2, 96)), 
      set (absoluteDeltaTime) (3) (off (2, 96))
    ])

  t.deepEqual (
    getPatternEvents (6, [on (0), [on (1), on (2)], [on (3), on (4)]]),
    [
      set (absoluteDeltaTime) (0) (on (0, 96)), 
      set (absoluteDeltaTime) (2) (off (0, 96)),
      set (absoluteDeltaTime) (2) (on (1, 96)), 
      set (absoluteDeltaTime) (3) (off (1, 96)),
      set (absoluteDeltaTime) (3) (on (2, 96)), 
      set (absoluteDeltaTime) (4) (off (2, 96)),
      set (absoluteDeltaTime) (4) (on (3, 96)), 
      set (absoluteDeltaTime) (5) (off (3, 96)),
      set (absoluteDeltaTime) (5) (on (4, 96)), 
      set (absoluteDeltaTime) (6) (off (4, 96))
    ])

  t.deepEqual (
    getPatternEvents (3, [mc (), mc (), mc ()]),
    [
      set (absoluteDeltaTime) (0) (mc (0, 0)),
      set (absoluteDeltaTime) (1) (mc (0, 1)),
      set (absoluteDeltaTime) (2) (mc (0, 1))
    ])

  t.deepEqual (
    getPatternEvents (6, [beatEvent (), restEvent (), subdivisionEvent (), beatEvent (), subdivisionEvent (), restEvent ()]),
    [
      set (absoluteDeltaTime) (0) (beatEvent ()),
      set (absoluteDeltaTime) (1) (restEvent (0)),
      set (absoluteDeltaTime) (2) (subdivisionEvent (0)),
      set (absoluteDeltaTime) (3) (beatEvent (0)),
      set (absoluteDeltaTime) (4) (subdivisionEvent (0)),
      set (absoluteDeltaTime) (5) (restEvent (0))
    ])
})

test ('pattern', (t) => {
  t.deepEqual (
    pattern ([on (0), on (1), on (2)]),
    [[
      set (deltaTime) (0) (on (0, 96)),
      set (deltaTime) (1) (off (0, 96)),
      set (deltaTime) (0) (on (1, 96)),
      set (deltaTime) (1) (off (1, 96)),
      set (deltaTime) (0) (on (2, 96)),
      set (deltaTime) (1) (off (2, 96))
    ], 3])

  t.deepEqual (
    pattern ([on (0), [on (1), on (2)], [on (3), on (4)]]),
    [[
      set (deltaTime) (0) (on (0, 96)),
      set (deltaTime) (2) (off (0, 96)),
      set (deltaTime) (0) (on (1, 96)), 
      set (deltaTime) (1) (off (1, 96)),
      set (deltaTime) (0) (on (2, 96)), 
      set (deltaTime) (1) (off (2, 96)),
      set (deltaTime) (0) (on (3, 96)), 
      set (deltaTime) (1) (off (3, 96)),
      set (deltaTime) (0) (on (4, 96)), 
      set (deltaTime) (1) (off (4, 96))
    ], 6])

  t.deepEqual (
    pattern ([mc (), mc (), mc ()]),
    [[
      set (deltaTime) (0) (mc ()),
      set (deltaTime) (1) (mc ()),
      set (deltaTime) (1) (mc ())
    ], 3])

  t.deepEqual (
    pattern ([beatEvent (), restEvent (), subdivisionEvent (), beatEvent (), subdivisionEvent (), restEvent ()]),
    [[
      set (deltaTime) (0) (beatEvent ()),
      set (deltaTime) (1) (restEvent (0)),
      set (deltaTime) (1) (subdivisionEvent (0)),
      set (deltaTime) (1) (beatEvent (0)),
      set (deltaTime) (1) (subdivisionEvent (0)),
      set (deltaTime) (1) (restEvent (0))
    ], 6])
})
