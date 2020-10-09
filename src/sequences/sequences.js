import { isMIDIClock, isTempoChange } from '../predicates'
import { from } from '../messages'
import { timeStamp } from '../lenses'
import { timer, clock } from '../clock'
import { 
   from as rx_from, NEVER as rx_NEVER, pipe as rx_pipe 
 } from 'rxjs'
import { 
    map as rxo_map, 
    mergeMap as rxo_mergeMap,
    tap as rxo_tap, 
    scan as rxo_scan,
    switchMap as rxo_switchMap
  } from 'rxjs/operators'
import {
    __, addIndex, always, all, allPass, append, assoc, both, 
    clone, concat, curry,
    either, evolve, filter, flatten, forEach, 
    has, head, is, isEmpty, last,
    map, mapAccum, mergeLeft, objOf, 
    pipe, prop, propIs, propEq, propSatisfies,
    reduce, reduceWhile, scan, set, slice, sort, sortBy, splitWhen,
    tail, view
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

export const withAbsoluteDeltaTime = curry ((acc_tick, msg) =>
  [
    acc_tick + msg.deltaTime,
    assoc ('absoluteDeltaTime') (acc_tick + msg.deltaTime) (msg)
  ]
)

export const withAbsoluteDeltaTimes = (sequence) => 
  evolve ({
    tracks: map (pipe (mapAccum (withAbsoluteDeltaTime) (0), last))
  }) (sequence)

export const mergeTracks = (sequence) =>
  evolve ({
    tracks: (tracks) => [flatten (tracks)]
  }) (sequence)
    
export const sortEvents = (sequence) =>
  evolve ({
    tracks: (tracks) => [sortBy (prop ('absoluteDeltaTime')) (tracks [0])]
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

// sequence player must be able to maintain state to not need to 
// constantly filter everything
export const prepareSequence = (sequence) =>
  pipe (
    withAbsoluteDeltaTimes,
    mergeTracks,
    sortEvents
  ) (sequence)

// TODO: Important having loops into account !!!!
export const sequencePlayer = (sequence) => 
  (currentAbsoluteDeltaTime, playable) => 
    (now) => {
      // TODO: Filter first events if playable is null and
      // currentAbsoluteDeltaTime is not 0
      if (playable === undefined || playable === null) {
        playable = prepareSequence (sequence)
      }

      let events = 
        splitWhen ((e) => e.absoluteDeltaTime > currentAbsoluteDeltaTime)
                  (playable.tracks [0])

      return [
        currentAbsoluteDeltaTime + 1,
        createSequence (events [1]) (playable.timeDivision),
        map (set (timeStamp) (now)) (events [0])
      ]
    }

export const player = (sequence) => {
  let seqPlayer = sequencePlayer (sequence)

  return rx_pipe (
    // TODO: player should respond to start, continue and stop !
    rxo_scan (([currentTick, playable, _events], msg) => 
      isMIDIClock (msg) ?
        seqPlayer (currentTick, playable) (view (timeStamp) (msg))
        : [currentTick, playable, [msg]]
    , [0, null, null]),
    rxo_mergeMap (([_dt, _s, events]) => 
      isEmpty (events) ?
        rx_NEVER
        : rx_from (events))
  )
}

//export const play = (midifile) => {
//    let t = timer ()
//    let clock = clock (30, midifile.timeDivision)
//
//    return t.pipe (
//      clock,
//      player (midifile),
//      rxo_tap ((events) => 
//        forEach ((m) => clock.bpm (QNPM2BPM (m.data [0])))
//                (filter (isTempoChange) (events)))
//    )
//  }
//  
//export const QNPM2BPM = (qnpm) => 60 * 1000000 / qnpm
//
