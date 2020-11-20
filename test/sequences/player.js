const test = require ('ava')
import { 
  player, sequencePlayer
} from '../../src/sequences/player.js'
import { sequence, setup_scheduler } from './sequences.js'
import { 
  adjustTrack, createLoop, dropEvents, createSequence, 
  getTrack, mergeTracks,
  addTime, withoutTime, withoutDeltaTime
} from '../../src/sequences/sequences.js'
import { pattern, setEndDelta } from '../../src/sequences/patterns.js'
import { 
  cont, mc, off, on, start, stop 
} from '../../src/messages/messages.js'
import { endOfTrack } from '../../src/messages/meta.js'
import { 
  time, deltaTime, timeStamp 
} from '../../src/lenses/lenses.js'
import { multiSet } from '../../src/utils.js'
import { 
  dissoc, drop, head, init, last, map, pipe, prepend, set, tail, take 
} from 'ramda'

test ('sequencePlayer', (t) => {
  const player = sequencePlayer (sequence)
  const track = getTrack (0) (mergeTracks (sequence))

  t.deepEqual (
    player (0) (mc (0)),
    [
      1, 
      addTime (drop (2) (track)),
      [mc (0), ...withoutDeltaTime (take (2) (track))]
    ])
})

test ('sequencePlayer 2', (t) => {
  const player = sequencePlayer (sequence)
  const track = getTrack (0) (mergeTracks (sequence))

  t.deepEqual (
    player (...player (0) (mc (0))) (mc (1)),
    [
      2, 
      drop (4) (addTime (track)),
      [
        mc (1), 
        ...pipe (
          withoutDeltaTime,
          drop (2),
          take (2),
          map (set (timeStamp) (1))
        ) (track)
      ]
    ])
})

test ('sequencePlayer 3', (t) => {
  const player = sequencePlayer (sequence)
  const track = getTrack (0) (mergeTracks (sequence))

  t.deepEqual (
    player (...player (4) (mc (4))) (mc (5)),
    [
      6, 
      drop (6) (addTime (track)),
      [mc (5)]
    ])

  t.deepEqual (
    player (...player (7) (mc (7))) (mc (8)),
    [
      9, 
      drop (8) (addTime (track)),
      [
        mc (8),
        set (timeStamp) (8) (last (init (withoutDeltaTime (track)))),
      ]
    ])
})

test ('sequencePlayer should filter events happening before current time', (t) => {
  let player = sequencePlayer (sequence)
  let track = getTrack (0) (mergeTracks (sequence))

  t.deepEqual (
    player (4) (mc (0)),
    [
      5, 
      drop (6) (addTime (track)),
      [
        mc (0),
        head (drop (5) (withoutDeltaTime (track)))
      ]
    ])
})

test ('sequencePlayer with a loop', (t) => {
  const pat = setEndDelta (0) (pattern ([on (64), off (64)]))

  const player = 
    sequencePlayer 
      (createLoop 
        (createSequence 
          (...pat)))

  t.deepEqual (
    player (0) (mc (0)),
    [
      1,
      drop (1) (addTime (pat [0])),
      [
        mc (0),
        ...take (1) (withoutDeltaTime (pat [0]))
      ]
    ])

  t.deepEqual (
    player (...player (0) (mc (0))) (mc (1)),
    [
      1,
      drop (1) (addTime (pat [0])),
      [
        mc (1),
        ...map (set (timeStamp) (1)) (tail (withoutDeltaTime (pat [0]))),
        set (timeStamp) (1) (head (withoutDeltaTime (pat [0])))
      ]
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
      b: on (64, 96),
      c: on (32, 96),
      //
      d: mc (1),
      e: set (timeStamp) (1) (off (64, 96)),
      f: set (timeStamp) (1) (on (67, 96)),
      //
      g: mc (2),
      //
      h: mc (3),
      i: set (timeStamp) (3) (off (67, 96)),
      //
      j: mc (4),
      k: set (timeStamp) (4) (on (71, 96)),
      //
      l: mc (5),
      //
      m: mc (6),
      //
      n: mc (7),
      o: set (timeStamp) (7) (off (71, 96)),
      //
      p: mc (8),
      q: set (timeStamp) (8) (off (32, 96))
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
        c: stop (), 
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
      b: on (64, 96),
      c: on (32, 96),
      //
      d: mc (1),
      e: set (timeStamp) (1) (off (64, 96)),
      f: set (timeStamp) (1) (on (67, 96)),
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
      l: set (timeStamp) (6) (off (67, 96)),
      //
      m: start (),
      //
      n: mc (8),
      o: set (timeStamp) (8) (on (64, 96)),
      p: set (timeStamp) (8) (on (32, 96)),
      //
      q: stop (),
      r: off (64, 127),
      s: off (32, 127),
      //
      t: start (),
      //
      u: mc (11),
      v: set (timeStamp) (11) (on (64, 96)),
      w: set (timeStamp) (11) (on (32, 96))
    }

    expectObservable (
      source.pipe (player (sequence))
    ).toBe (expected, values)
  })
})
