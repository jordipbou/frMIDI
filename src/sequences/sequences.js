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

export const filterEvents = curry ((p, sequence) =>
  evolve ({
    tracks: map (filter (p))
  }) (sequence)
)
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

// -------------------------------- Looper -------------------------------

//export const toLoop = () =>
//  rx_pipe (
//    rx_map ((msg) =>
//      isSequenceEvent (msg) ?
//        sequenceEvent (createLoop (view (sequence) (msg)))
//        : msg))

// looper = pipe (recorder, toLoop, player)

// Let's start without overdubs just record a loop and continue playing
