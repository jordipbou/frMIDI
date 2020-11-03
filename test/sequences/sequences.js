const test = require ('ava')
import { 
    isNoteOn, isNoteOff, seemsMessage 
  } from '../../src/predicates'
import { on, off, mc, start, stop, cont } from '../../src/messages'
import { sequenceEvent } from '../../src/messages/frmeta.js'
import { 
    absoluteDeltaTime, deltaTime, note, timeStamp
  } from '../../src/lenses/lenses.js'
import { 
    createSequence,
    createLoop,
    filterTracks,
    mergeTracks,
    player,
    prepareSequence,
    recorder,
    recordToTrack,
    sequencePlayer,
    seemsSequence,
    sortEvents,
    setTimeDivision,
    withAbsoluteDeltaTime,
    withAbsoluteDeltaTimes
  } from '../../src/sequences/sequences.js'
import { multiSet } from '../../src/utils.js'
import { 
  assoc, dissoc, drop, identical, is, last, map, prepend, set, take, view 
  } from 'ramda'
import { TestScheduler } from 'rxjs/testing'

export const setup_scheduler = (t) =>
  new TestScheduler ((actual, expected) => {
    t.deepEqual (actual, expected)
  })

export const sequence = {
  formatType: 1,
  timeDivision: 1,
  tracks: [
    [
        set (deltaTime) (0) (on (64)),
        set (deltaTime) (1) (off (64)),
        set (deltaTime) (0) (on (67)),
        set (deltaTime) (2) (off (67)),
        set (deltaTime) (1) (on (71)),
        set (deltaTime) (3) (off (71))
    ],
    [
        set (deltaTime) (0) (on (32)),
        set (deltaTime) (8) (off (32)),
    ]
  ]
}

test ('seems sequence', (t) => {
  t.true (seemsSequence (sequence))
})

test ('add absolute delta time to single message', (t) => {
  t.deepEqual (
    withAbsoluteDeltaTime (0) (on (64)),
    [0, assoc ('absoluteDeltaTime') (0) (on (64))])

  t.deepEqual (
    withAbsoluteDeltaTime (150) (on (64)),
    [150, assoc ('absoluteDeltaTime') (150) (on (64))])

  t.deepEqual (
    withAbsoluteDeltaTime (150) (on (64, 96, 0, 0, 15)),
    [165, assoc ('absoluteDeltaTime') (165) (on (64, 96, 0, 0, 15))])
})

test ('withAbsoluteDeltaTimes', (t) => {
  let modified = withAbsoluteDeltaTimes (sequence)

  t.true (seemsSequence (modified))
  t.not (modified.tracks, sequence.tracks)
  t.not (modified.tracks [0], sequence.tracks [0])
  t.not (modified.tracks [1], sequence.tracks [1])

  let track = modified.tracks [0]
  let original_track = sequence.tracks [0]

  t.is (track.length, 6)
  t.is (track [0].absoluteDeltaTime, 0)
  t.is (track [1].absoluteDeltaTime, 1)
  t.is (track [2].absoluteDeltaTime, 1)
  t.is (track [3].absoluteDeltaTime, 3)
  t.is (track [4].absoluteDeltaTime, 4)
  t.is (track [5].absoluteDeltaTime, 7)

  let track1 = modified.tracks [1]

  t.is (track1.length, 2)
  t.is (track1 [0].absoluteDeltaTime, 0)
  t.is (track1 [1].absoluteDeltaTime, 8)
})

test ('mergeTracks', (t) => {
  let modified = mergeTracks (sequence)

  t.log (modified)

  t.true (seemsSequence (modified))
  t.false (identical (modified, sequence))
  t.not (modified.tracks, sequence.tracks)
  t.not (modified.tracks [0], sequence.tracks [0])

  let track = modified.tracks [0]
  let original_track = sequence.tracks [0]

  t.true (isNoteOn (track [0]))
  t.true (isNoteOff (track [1]))
  t.true (isNoteOn (track [2]))
  t.true (isNoteOff (track [3]))
  t.true (isNoteOn (track [4]))
  t.true (isNoteOff (track [5]))
  t.true (isNoteOn (track [6]))
  t.is (view (note) (track [6]), 32)
  t.true (isNoteOff (track [7]))
  t.is (view (note) (track [7]), 32)
})

test ('sortEvents', (t) => {
  let new_sequence = mergeTracks (withAbsoluteDeltaTimes (sequence))
  let modified = sortEvents (new_sequence)

  t.true (seemsSequence (modified))
  t.false (identical (modified, new_sequence))
  t.not (modified.tracks, new_sequence.tracks)
  t.not (modified.tracks [0], new_sequence.tracks [0])

  let track = modified.tracks [0]
  let original_track = new_sequence.tracks [0]

  t.is (track [0].absoluteDeltaTime, 0)
  t.is (track [1].absoluteDeltaTime, 0)
  t.is (track [2].absoluteDeltaTime, 1)
  t.is (track [3].absoluteDeltaTime, 1)
  t.is (track [4].absoluteDeltaTime, 3)
  t.is (track [5].absoluteDeltaTime, 4)
  t.is (track [6].absoluteDeltaTime, 7)
  t.is (track [7].absoluteDeltaTime, 8)
})

test ('setTimeDivision', (t) => {
  let modified = setTimeDivision (4) (sequence)
  let track0 = modified.tracks [0]
  let track1 = modified.tracks [1]

  t.is (modified.timeDivision, 4)

  t.is (track0 [0].deltaTime, 0)
  t.is (track0 [1].deltaTime, 4)
  t.is (track0 [2].deltaTime, 0)
  t.is (track0 [3].deltaTime, 8)
  t.is (track0 [4].deltaTime, 4)
  t.is (track0 [5].deltaTime, 12)

  t.is (track1 [0].deltaTime, 0)
  t.is (track1 [1].deltaTime, 32)
})

//test ('filterTracks', (t) => {
//  let modified = filterTracks ([1], sequence)
//
//  t.true (seemsSequence (modified))
//  t.false (identical (modified, sequence))
//  t.not (modified.track, sequence.track)
//  t.not (modified.track [0], sequence.track [1])
//  t.not (modified.track [0].event, sequence.track [1].event)
//
//  t.is (modified.tracks, 1)
//
//  let track = modified.track [0].event
//  let original_track = sequence.track [1].event
//
//  t.is (track.length, 2)
//  t.is (track [0].deltaTime, 0)
//  t.false (identical (track [0], original_track [0]))
//  t.is (track [1].deltaTime, 8)
//  t.false (identical (track [1], original_track [1]))
//})

test ('create sequence', (t) => {
  let track = [
    set (deltaTime) (0) (on (64)),
    set (deltaTime) (1) (off (64)),
    set (deltaTime) (0) (on (67)),
    set (deltaTime) (2) (off (67)),
    set (deltaTime) (1) (on (71)),
    set (deltaTime) (3) (off (71))
  ]
  let newsequence = createSequence (track) (1)

  t.true (seemsSequence (newsequence))
  t.deepEqual (track, newsequence.tracks [0])

  newsequence = createSequence (track) (96)

  t.true (seemsSequence (newsequence))
  t.is (newsequence.timeDivision, 96)
  t.deepEqual (track, newsequence.tracks [0])
})

test ('createLoop', (t) => {
  let loop = createLoop (sequence)

  t.true (loop.loop)
  t.deepEqual (dissoc ('loop') (loop), sequence)
})
