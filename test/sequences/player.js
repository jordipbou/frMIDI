const test = require ('ava')
import { 
  prepareSequence, player, sequencePlayer
} from '../../src/sequences/player.js'
import { sequence, setup_scheduler } from './sequences.js'
import { 
  createLoop, createSequence 
} from '../../src/sequences/sequences.js'
import { 
  cont, mc, off, on, start, stop 
} from '../../src/messages/messages.js'
import { absoluteDeltaTime, timeStamp } from '../../src/lenses/lenses.js'
import { multiSet } from '../../src/utils.js'
import { drop, last, map, prepend, set, take } from 'ramda'

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
