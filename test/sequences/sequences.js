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

const setup_scheduler = (t) =>
  new TestScheduler ((actual, expected) => {
    t.deepEqual (actual, expected)
  })

let sequence = {
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

test ('prepare sequence for playing by merging its tracks into one and sorting its events by absoluteDeltaTime', (t) => {
  t.deepEqual (
    prepareSequence (sequence),
    {
      formatType: 1,
      timeDivision: 1,
      tracks: [
        [
          set (absoluteDeltaTime) (0) (on (64, 96, 0, 0, 0)),
          set (absoluteDeltaTime) (0) (on (32, 96, 0, 0, 0)),
          set (absoluteDeltaTime) (1) (off (64, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (1) (on (67, 96, 0, 0, 0)),
          set (absoluteDeltaTime) (3) (off (67, 96, 0, 0, 2)),
          set (absoluteDeltaTime) (4) (on (71, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ]
      ]
   })
})

test ('sequencePlayer', (t) => {
  let player = sequencePlayer (sequence)
  let playable = prepareSequence (sequence)

  t.deepEqual (
    player (0) (mc (0)),
    [
      1, 
      createSequence 
        ([
          set (absoluteDeltaTime) (1) (off (64, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (1) (on (67, 96, 0, 0, 0)),
          set (absoluteDeltaTime) (3) (off (67, 96, 0, 0, 2)),
          set (absoluteDeltaTime) (4) (on (71, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ])
        (playable.timeDivision),
      prepend
        (mc (0))
        (take (2) (playable.tracks [0]))
    ])

  t.deepEqual (
    player (...player (0) (mc (0))) (mc (1)),
    [
      2, 
      createSequence 
        ([
          set (absoluteDeltaTime) (3) (off (67, 96, 0, 0, 2)),
          set (absoluteDeltaTime) (4) (on (71, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ])
        (playable.timeDivision),
      prepend (mc (1))
              (take (2) 
                    (map (set (timeStamp) (1))
                         (drop (2) (playable.tracks [0]))))
    ])

  t.deepEqual (
    player (...player (4) (mc (4))) (mc (5)),
    [
      6, 
      createSequence 
        ([
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ])
        (playable.timeDivision),
      [mc (5)]
    ])

  t.deepEqual (
    player (...player (7) (mc (7))) (mc (8)),
    [
      9, 
      createSequence ([]) (playable.timeDivision),
      [mc (8), set (timeStamp) (8) (last (playable.tracks [0]))]
    ])
})

test ('sequencePlayer should filter events happening before currentAbsoluteDeltaTime', (t) => {
  let player = sequencePlayer (sequence)
  let playable = prepareSequence (sequence)

  t.deepEqual (
    player (4) (mc (0)),
    [
      5, 
      createSequence 
        ([
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ])
        (playable.timeDivision),
      [mc (0), ...take (1) (drop (5) (playable.tracks [0]))]
    ])
})

test ('player operator', (t) => {
  const scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      '               a----b----cd---e---fgh---(i|)', 
      {
        a: mc (0),
        b: mc (1),
        c: mc (2),
        d: mc (3),
        e: mc (4),
        f: mc (5),
        g: mc (6),
        h: mc (7),
        i: mc (8)
      })

    const expected = '(abc)(def)g(hi)(jk)lm(no)(pq|)' 
    const values = {
      a: mc (0),
      b: set (absoluteDeltaTime) (0) (on (64, 96, 0, 0, 0)),
      c: set (absoluteDeltaTime) (0) (on (32, 96, 0, 0, 0)),
      //
      d: mc (1),
      e: multiSet ([timeStamp, absoluteDeltaTime]) ([1, 1]) 
                  (off (64, 96, 0, 0, 1)),
      f: multiSet ([timeStamp, absoluteDeltaTime]) ([1, 1]) 
                  (on (67, 96, 0, 0, 0)),
      //
      g: mc (2),
      //
      h: mc (3),
      i: multiSet ([timeStamp, absoluteDeltaTime]) ([3, 3]) 
                  (off (67, 96, 0, 0, 2)),
      //
      j: mc (4),
      k: multiSet ([timeStamp, absoluteDeltaTime]) ([4, 4]) 
                  (on (71, 96, 0, 0, 1)),
      //
      l: mc (5),
      //
      m: mc (6),
      //
      n: mc (7),
      o: multiSet ([timeStamp, absoluteDeltaTime]) ([7, 7]) 
                  (off (71, 96, 0, 0, 3)),
      //
      p: mc (8),
      q: multiSet ([timeStamp, absoluteDeltaTime]) ([8, 8]) 
                  (off (32, 96, 0, 0, 8))
    }

    expectObservable (
      source.pipe (player (sequence))
    ).toBe (expected, values)
  })
})

test ('player operator must respond to start, continue and stop messages', (t) => {
  const scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      '               a----b----c----defg---hi----j----k(l|)', 
      {
        a: mc (0),
        b: mc (1),
        c: stop (), // TODO: Add this note offs on expected !!!!
        d: mc (3),
        e: cont (),
        f: mc (5),
        g: mc (6),
        h: start (),
        i: mc (8),
        j: stop (),
        k: start (),
        l: mc (11)
      })
    const expected = '(abc)(def)(gxy)hij(kl)m(nop)(qrs)t(uvw|)'
    const values = {
      a: mc (0),
      b: set (absoluteDeltaTime) (0) (on (64, 96, 0, 0, 0)),
      c: set (absoluteDeltaTime) (0) (on (32, 96, 0, 0, 0)),
      //
      d: mc (1),
      e: multiSet ([timeStamp, absoluteDeltaTime]) ([1, 1]) 
                  (off (64, 96, 0, 0, 1)),
      f: multiSet ([timeStamp, absoluteDeltaTime]) ([1, 1]) 
                  (on (67, 96, 0, 0, 0)),
      //
      g: stop (),
      x: off (32, 127),
      y: off (67, 127),
      //
      h: mc (3),
      //
      i: cont (),
      //
      j: mc (5),
      //
      k: mc (6),
      l: multiSet ([timeStamp, absoluteDeltaTime]) ([6, 3]) 
                  (off (67, 96, 0, 0, 2)),
      //
      m: start (),
      //
      n: mc (8),
      o: multiSet ([timeStamp, absoluteDeltaTime]) ([8, 0]) 
                  (on (64, 96, 0, 0, 0)),
      p: multiSet ([timeStamp, absoluteDeltaTime]) ([8, 0]) 
                  (on (32, 96, 0, 0, 0)),
      //
      q: stop (),
      r: off (64, 127, 0, 0, 0),
      s: off (32, 127, 0, 0, 0),
      //
      t: start (),
      //
      u: mc (11),
      v: multiSet ([timeStamp, absoluteDeltaTime]) ([11, 0]) 
                  (on (64, 96, 0, 0, 0)),
      w: multiSet ([timeStamp, absoluteDeltaTime]) ([11, 0]) 
                  (on (32, 96, 0, 0, 0))
    }

    expectObservable (
      source.pipe (player (sequence))
    ).toBe (expected, values)
  })
})

test ('sequencePlayer with a loop should return last events and first events if tick is last, rest being equal to non loop', (t) => {
  let player = sequencePlayer (createLoop (sequence))
  let playable = prepareSequence (createLoop (sequence))

  t.deepEqual (
    player (0) (mc (0)),
    [
      1, 
      createSequence 
        ([
          set (absoluteDeltaTime) (1) (off (64, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (1) (on (67, 96, 0, 0, 0)),
          set (absoluteDeltaTime) (3) (off (67, 96, 0, 0, 2)),
          set (absoluteDeltaTime) (4) (on (71, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ])
        (playable.timeDivision),
      [mc (0), ...take (2) (playable.tracks [0])]
    ])

  t.deepEqual (
    player (...player (7) (mc (7))) (mc (8)),
    [
      1, 
      createSequence 
        ([
          set (absoluteDeltaTime) (1) (off (64, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (1) (on (67, 96, 0, 0, 0)),
          set (absoluteDeltaTime) (3) (off (67, 96, 0, 0, 2)),
          set (absoluteDeltaTime) (4) (on (71, 96, 0, 0, 1)),
          set (absoluteDeltaTime) (7) (off (71, 96, 0, 0, 3)),
          set (absoluteDeltaTime) (8) (off (32, 96, 0, 0, 8))
        ])
        (playable.timeDivision),
      prepend (mc (8))
              (map (set (timeStamp) (8))
                   (prepend (last (playable.tracks [0])) 
                            (take (2) (playable.tracks [0]))))
    ])
})

test ('recordToTrack', (t) => {
  t.deepEqual (
    recordToTrack (0) (createSequence ([], 1)) (on (64)),
    createSequence ([on (64)], 1))
})

test ('recorder', (t) => {
  const scheduler = setup_scheduler (t)

  scheduler.run (({ cold, expectObservable }) => {
    const source = cold (
      '               a---b---cd---ef',
      {
        a: on (64),
        b: on (67),
        c: mc (1),
        d: off (67),
        e: mc (2),
        f: off (64)
      })

    const expected = '(az)(by)c(dx)e(fw)'
    const values = {
      a: on (64),
      z: sequenceEvent (createSequence ([on (64)], 1)),
      b: on (67),
      y: sequenceEvent (
           createSequence ([
             on (64), 
             on (67)
           ]) (1)),
      c: mc (1),
      d: off (67),
      x: sequenceEvent (
           createSequence ([
             on (64),
             on (67),
             off (67, 96, 0, 0, 1)
          ]) (1)),
      e: mc (2),
      f: off (64),
      w: sequenceEvent (
           createSequence ([
             on (64),
             on (67),
             off (67, 96, 0, 0, 1),
             off (64, 96, 0, 0, 2)
          ]) (1))
    }

    expectObservable (
      source.pipe (recorder (1, false))
    ).toBe (expected, values)
  })
})
