const test = require ('ava')
import { 
  concatPatterns, getPatternTimeDivision, getPatternEvents, 
  pattern, setEndDelta
} from '../../src/sequences/patterns.js'
import { mc, off, on } from '../../src/messages/messages.js'
import { endOfTrack } from '../../src/messages/meta.js'
import {
  barEvent, beatEvent, restEvent, subdivisionEvent,
  patternItemEvent
} from '../../src/messages/frmeta.js'
import { data0, lensP, time, deltaTime } from '../../src/lenses/lenses.js'
import { mapTrackEvents } from '../../src/sequences/sequences.js'
import { equals, set } from 'ramda'

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

test ('getPatternEvents 1', (t) => {
  t.deepEqual (
    getPatternEvents (1, [0]),
    [ 
      set (time) (0) (patternItemEvent (0))
    ])
})

test ('getPatternEvents 2', (t) => {
  t.deepEqual (
    getPatternEvents (3, [0, 'hola', { a: 1 }]),
    [ 
      set (time) (0) (patternItemEvent (0)),
      set (time) (1) (patternItemEvent ('hola')),
      set (time) (2) (patternItemEvent ({ a: 1 }))
    ])
})

test ('getPatternEvents 3', (t) => {
  t.deepEqual (
    getPatternEvents (6, ['hello', ['world', 'of'], 'patterns']),
    [
      set (time) (0) (patternItemEvent ('hello')),
      set (time) (2) (patternItemEvent ('world')),
      set (time) (3) (patternItemEvent ('of')),
      set (time) (4) (patternItemEvent ('patterns'))
    ])
})

test ('concatPatterns', (t) => {
  t.deepEqual (
    concatPatterns (pattern ([1, 2, 3]), pattern ([5, [6, 7]])),
    [
      [
        set (deltaTime) (0) (patternItemEvent (1)),
        set (deltaTime) (4) (patternItemEvent (2)),
        set (deltaTime) (4) (patternItemEvent (3)),
        set (deltaTime) (4) (patternItemEvent (5)),
        set (deltaTime) (6) (patternItemEvent (6)),
        set (deltaTime) (3) (patternItemEvent (7)),
        set (deltaTime) (3) (endOfTrack ())
      ],
      12
    ])
})

test ('pattern 1', (t) => {
  t.deepEqual (
    pattern ([0]),
    [
      [ 
        set (deltaTime) (0) (patternItemEvent (0)),
        set (deltaTime) (1) (endOfTrack ()) 
      ],
      1
    ])
})

test ('pattern 2', (t) => {
  t.deepEqual (
    pattern ([0, 'hola', { a: 1 }]),
    [
      [ 
        set (deltaTime) (0) (patternItemEvent (0)),
        set (deltaTime) (1) (patternItemEvent ('hola')),
        set (deltaTime) (1) (patternItemEvent ({ a: 1 })),
        set (deltaTime) (1) (endOfTrack ())
      ],
      3
    ])
})

test ('pattern 3', (t) => {
  t.deepEqual (
    pattern (['hello', ['world', 'of'], 'patterns']),
    [
      [
        set (deltaTime) (0) (patternItemEvent ('hello')),
        set (deltaTime) (2) (patternItemEvent ('world')),
        set (deltaTime) (1) (patternItemEvent ('of')),
        set (deltaTime) (1) (patternItemEvent ('patterns')),
        set (deltaTime) (2) (endOfTrack ())
      ],
      6
    ])
})

test ('empty pattern 1', (t) => {
  t.deepEqual (
    pattern ([]),
    [ [ set (deltaTime) (0) (endOfTrack ()) ], 1 ])
})

test ('empty pattern 2', (t) => {
  t.deepEqual (
    pattern (),
    [ [ set (deltaTime) (0) (endOfTrack ()) ], 1 ])
})

test ('pattern with multiple bars', (t) => {
  t.deepEqual (
    pattern ([1, 2], [1, 2, 3]),
    [
      [
        set (deltaTime) (0) (patternItemEvent (1)),
        set (deltaTime) (3) (patternItemEvent (2)),
        set (deltaTime) (3) (patternItemEvent (1)),
        set (deltaTime) (2) (patternItemEvent (2)),
        set (deltaTime) (2) (patternItemEvent (3)),
        set (deltaTime) (2) (endOfTrack ())
      ],
     6 
    ])
})

test ('pattern with mapping', (t) => {
  const map = [
    [ lensP (data0) (equals) (0), [ on (64), off (64) ] ]
  ]

  t.deepEqual (
    mapTrackEvents (map) (pattern ([ 0 ]) [0]),
    [
      set (deltaTime) (0) (on (64)),
      set (deltaTime) (1) (off (64)),
      set (deltaTime) (0) (endOfTrack ())
    ])
})

test ('setEndDelta', (t) => {
  t.deepEqual (
    setEndDelta (0) (pattern ([1, 2])),
    [
      [
        set (deltaTime) (0) (patternItemEvent (1)),
        set (deltaTime) (1) (patternItemEvent (2)),
        set (deltaTime) (0) (endOfTrack ())
      ],
      2
    ])
})
