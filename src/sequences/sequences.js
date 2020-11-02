import { 
    isContinue, isMIDIClock, isStart,
    isSequenceEvent, isStop, isTempoChange
  } from '../predicates'
import { from } from '../messages'
import { sequenceEvent } from '../messages/frmeta.js'
import { deltaTime, timeStamp, sequence as sequenceLens } from '../lenses'
import { timer, clock } from '../clock'
import { processMessage } from './state.js'
import { 
   from as rx_from, NEVER as rx_NEVER, merge as rx_merge,
   pipe as rx_pipe, Subject as rx_Subject
 } from 'rxjs'
import { 
    map as rxo_map, 
    mergeMap as rxo_mergeMap,
    tap as rxo_tap, 
    scan as rxo_scan,
    switchMap as rxo_switchMap
  } from 'rxjs/operators'
import {
    __, addIndex, always, all, allPass, and, append, assoc, both, 
    clone, concat, cond, curry, dropWhile,
    either, evolve, F, filter, flatten, forEach, 
    has, head, is, isEmpty, isNil, last,
    map, mapAccum, mergeLeft, not, objOf, 
    pipe, prepend, prop, propIs, propEq, propSatisfies,
    reduce, reduceWhile, scan, set, slice, sort, sortBy, splitWhen,
    T, tail, view
  } from 'ramda'

// ------------------------- Predicates ----------------------------

export const seemsSequence = (sequence) =>
  allPass ([is (Object),
            has ('formatType'),
            has ('timeDivision'),
            has ('tracks'),
            propIs (Array) ('tracks'),
            propSatisfies (all (is (Array))) ('tracks')])
          (sequence)

export const seemsLoop = (sequence) =>
  both (seemsSequence)
       (propEq ('loop', true))
       (sequence)

// -------------------------- Helpers ------------------------------

export const mapTracks = curry((fn, sequence) =>
  evolve ({
    tracks: fn
  }) (sequence)
)

export const withAbsoluteDeltaTime = curry ((acc_tick, msg) =>
  [
    acc_tick + msg.deltaTime,
    assoc ('absoluteDeltaTime') (acc_tick + msg.deltaTime) (msg)
  ]
)

export const withAbsoluteDeltaTimes = (sequence) =>
  mapTracks 
    (map (pipe (mapAccum (withAbsoluteDeltaTime) (0), last)))
    (sequence)

export const mergeTracks = (sequence) =>
  mapTracks 
    ((tracks) => [flatten (tracks)]) 
    (sequence)

export const sortEvents = (sequence) =>
  mapTracks 
    ((tracks) => [sortBy (prop ('absoluteDeltaTime')) (tracks [0])])
    (sequence)

export const setTimeDivision = (td) => (sequence) =>
  evolve ({
    timeDivision: always (td),
    tracks: 
      map 
        (map 
          ((evt) => 
            set (deltaTime) 
                ((view (deltaTime) (evt)) * td / sequence.timeDivision) 
                (evt)))
  }) (sequence)

//export const filterTracks =	curry((tracks, sequence) => 
//  evolve ({
//    tracks: () => tracks.length,
//    track: pipe (
//      addIndex (filter) ((v, k) => tracks.includes (k)),
//      map (v => objOf ('event', map (from, v.event)))
//    )
//  }) (sequence))

// export const flattenTimestamps = 

// TODO
//export let addTrack/s = (midiFile, tracks) => 

// TODO
//export let changeTimeDivision = (midiFile, newTimeDivision) =>

// TODO
// export let commonTimeDivision = (midiFile1, midiFile2, ...) => 

// -------------- MIDI Sequence creation from tracks ---------------------

// TODO: createSequence should allow several tracks at once

export const createSequence = curry ((track, timeDivision) => ({
  formatType: 1,
  timeDivision: timeDivision,
  tracks: [track]
}))

export const createLoop =	(sequence) => 
  assoc ('loop') (true) (sequence)

// ------------------------ Playing MIDI Sequences -----------------------

export const prepareSequence = (sequence) =>
  pipe (
    withAbsoluteDeltaTimes,
    mergeTracks,
    sortEvents
  ) (sequence)

// TODO: Analyze another implementation option:
// [ first_event if absTime === currentAbsTime, ...recurse more events ]
export const sequencePlayer = (sequence) => {
  let prepared_sequence = prepareSequence (sequence)
  let maxTick = prop ('absoluteDeltaTime') 
                     (last (prepared_sequence.tracks [0]))

  let rec = (currentAbsoluteDeltaTime, playable) => {
    playable = playable || prepared_sequence

    return (msg) => {
      let filtered = 
        dropWhile 
          ((e) => e.absoluteDeltaTime < currentAbsoluteDeltaTime)
          (playable.tracks [0])

      let events = 
        splitWhen 
          ((e) => e.absoluteDeltaTime > currentAbsoluteDeltaTime)
          (filtered)

      if (sequence.loop && currentAbsoluteDeltaTime === maxTick) {
        let [_, seq, events2] = rec (0, prepared_sequence) (msg)

        return [
          1,
          seq,
          prepend 
            (msg)
            (concat (map (set (timeStamp) (view (timeStamp) (msg))) 
                         (events [0])) 
                    (tail (events2)))
        ]
      } else {
        return [
          currentAbsoluteDeltaTime + 1,
          createSequence (events [1]) (playable.timeDivision),
          prepend (msg)
                  (map (set (timeStamp) (view (timeStamp) (msg))) 
                       (events [0]))
        ]
      }
    }
  }

  return rec
}

export const player = (sequence, paused = false) =>
  rx_pipe (
    rxo_scan (
      ([seqPlayer, tick, playable, _events, playing, state], msg) =>
        cond ([

          [isMIDIClock, (msg) => {
            if (playing) {
              const [nextTick, nextPlayable, events] =
                seqPlayer (tick, playable) (msg)

              return [
                seqPlayer,
                nextTick,
                nextPlayable,
                events,
                true,
                reduce ((a, v) => processMessage (a) (v)) (state) (events)
              ]
            } else {
              return [seqPlayer, tick, playable, [msg], false, state]
            }
          }],

          [isStart, (msg) =>
            [seqPlayer, 0, null, [msg], true, []]],

          [isContinue, (msg) =>
            [seqPlayer, tick, playable, [msg], true, []]],

          [isStop, (msg) => 
            [seqPlayer, 
             tick, 
             playable, 
             [msg, ...state],
             false, 
             []]],

          [isSequenceEvent, (msg) =>
            [sequencePlayer (view (sequenceLens) (msg)), 
             tick, 
             null, 
             [msg, ...state], 
             playing,
             []]],

          [T, (msg) =>
            [seqPlayer, 
             tick, 
             playable, 
             [msg], 
             playing, 
             state]]

        ]) (msg)
      , [sequencePlayer (sequence), 0, null, null, !paused, []]),
    rxo_mergeMap (([_p, _dt, _s, events]) => 
      either (isNil) (isEmpty) (events) ?
        rx_NEVER
        : rx_from (events)))

export const play = (midifile) => {
  let tempo_listener = new rx_Subject ()

  return rx_merge (
    timer (),
    tempo_listener
  ).pipe (
    clock (30, midifile.timeDivision),
    player (midifile),
    rxo_tap ((msg) => {
      if (isTempoChange (msg)) {
        tempo_listener.next (msg)
      }
    })
  )
}

// --------------------- Recording MIDI Sequences ------------------------

export const recordToTrack = (delta) => (sequence) => (msg) =>
  evolve ({
    tracks: 
      (tracks) => [ append (set (deltaTime) (delta) (msg)) (tracks [0]) ]
  }) (sequence)

export const recorder = (timeDivision, paused = true) =>
  rx_pipe (
    rxo_scan (([seq, delta, recording, td, _], msg) =>
      cond ([
        
        [isMIDIClock, 
          (msg) => recording ? [seq, delta + 1, true, td, [msg]]
                               : [seq, delta, false, td, [msg]]],

        [isStart, 
          (msg) => 
            [createSequence ([], td), 0, recording, td, [msg]]],

        [isContinue,
          (msg) => [seq, delta, true, td, [msg]]],

        [isStop,
          // stop message should add one end of track meta message to
          // have a sequence with the correct length
          (msg) => [seq, delta, false, td, [msg]]],

        [T,
          (msg) => 
            cond ([
              [T, 
                () => {
                  const nextSeq = recordToTrack (delta) (seq) (msg)

                  return [
                    nextSeq, 
                    delta, 
                    true, 
                    td, 
                    [ msg, sequenceEvent (nextSeq) ]
                  ]
                }],

              [F, () => [seq, delta, false, td, [msg]]],
            ]) (recording)]

      ]) (msg)

    , [createSequence ([], timeDivision), 
        0, 
        0, 
        !paused, 
        timeDivision, 
        null]),

    rxo_mergeMap (([_s, _d, _r, _td, events]) => 
      either (isNil) (isEmpty) (events) ?
        rx_NEVER
        : rx_from (events)))

// -------------------------------- Looper -------------------------------

//export const toLoop = () =>
//  rx_pipe (
//    rx_map ((msg) =>
//      isSequenceEvent (msg) ?
//        sequenceEvent (createLoop (view (sequence) (msg)))
//        : msg))

// looper = pipe (recorder, toLoop, player)

// Let's start without overdubs just record a loop and continue playing
