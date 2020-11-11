import { 
  isContinue, isMIDIClock, isStart,
  isSequenceEvent, isStop, isTempoChange
} from '../predicates/predicates.js'
import { seemsfrMessage } from '../predicates/frmeta.js'
import { from } from '../messages'
import { sequenceEvent } from '../messages/frmeta.js'
import { 
  absoluteDeltaTime, deltaTime, timeStamp, sequence as sequenceLens 
} from '../lenses/lenses.js'
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
  __, add, addIndex, adjust, always, all, allPass, and, append, assoc, 
  both, 
  clone, concat, complement, cond, curry, dissoc, drop, dropWhile,
  either, evolve, F, filter, flatten, forEach, 
  has, head, is, isEmpty, isNil, last,
  map, mapAccum, mergeLeft, not, objOf, over,
  pipe, prepend, prop, propIs, propEq, propSatisfies,
  reduce, reduceWhile, scan, set, slice, sort, sortBy, splitWhen,
  T, tail, view
} from 'ramda'

// DOUBTS
// - It's logical that loop is a property of a sequence, or should
//   it be a property of the player ? I don't really like it being
//   a property of the sequence.
// - 

// --------------------------- Predicates --------------------------------

export const seemsTrack = (track) => 
  both (is (Array)) 
       (all (seemsfrMessage))
    (track)

export const seemsSequence = (sequence) =>
  allPass ([is (Object),
            has ('formatType'),
            has ('timeDivision'),
            has ('tracks'),
            propIs (Array) ('tracks'),
            propSatisfies (all (seemsTrack)) ('tracks')])
          (sequence)

export const seemsLoop = (sequence) =>
  both (seemsSequence)
       (propEq ('loop', true))
       (sequence)

// ----------------------- Operations on tracks --------------------------

export const mapTracks = curry((fn, sequence) =>
  evolve ({
    tracks: map (fn)
  }) (sequence)
)

export const mapEvents = curry((fn, sequence) =>
  mapTracks 
    (map (fn))
    (sequence))

export const getTrack = curry((n, sequence) =>
  sequence.tracks [n])

// -------------- Working with delta and absolute delta times ------------

export const eventWithAbsoluteDeltaTime = curry ((acc_tick, msg) =>
  [
    acc_tick + msg.deltaTime,
    assoc ('absoluteDeltaTime') (acc_tick + msg.deltaTime) (msg)
  ]
)

export const trackWithAbsoluteDeltaTimes = (track) =>
  last (mapAccum (eventWithAbsoluteDeltaTime) (0) (track))

export const trackWithoutAbsoluteDeltaTimes = (track) =>
  map (dissoc ('absoluteDeltaTime')) (track)

export const trackWithoutDeltaTimes = (track) =>
  map (dissoc ('deltaTime')) (track)

export const withAbsoluteDeltaTimes = (sequence) =>
  mapTracks 
    (trackWithAbsoluteDeltaTimes)
    (sequence)

export const withoutAbsoluteDeltaTimes = (sequence) =>
  mapTracks
    (trackWithoutAbsoluteDeltaTimes)
    (sequence)

export const withoutDeltaTimes = (sequence) =>
  mapTracks
    (trackWithoutDeltaTimes)
    (sequence)

export const trackDeltaTimesFromAbsolutes = (track) =>
  pipe (
    mapAccum
      ((acc, evt) => [
        evt.absoluteDeltaTime,
        set (deltaTime) (evt.absoluteDeltaTime - acc) (evt)
      ]) (0),
    last) (track)

export const deltaTimesFromAbsolutes = (sequence) =>
  mapTracks
    (trackDeltaTimesFromAbsolutes)
    (sequence)

// ------------------------ Time division --------------------------------

export const setTimeDivision = curry ((td, sequence) =>
  evolve ({
    timeDivision: always (td),
    tracks: 
      map 
        (map 
          ((evt) => 
            set (deltaTime) 
                ((view (deltaTime) (evt)) * td / sequence.timeDivision) 
                (evt)))
  }) (sequence))

// -------------- MIDI Sequence creation from tracks ---------------------

export const createSequence = curry ((tracks, timeDivision) => 
({
    formatType: 1,
    timeDivision: timeDivision,
    tracks: is (Array) (tracks [0]) ? tracks : [ tracks ]
}))

export const createLoop =	(sequence) => 
  assoc ('loop') (true) (sequence)

// ---------------------- Operations on one track ------------------------

export const adjustTrack = curry ((track_idx, fn, sequence) =>
  evolve ({
    tracks: adjust (track_idx) (fn)
  }) (sequence))

// Functions that add or remove events from track/s have to be implemented
// because deltaTimes will be modified.

export const filterEvents = curry ((p, track) =>
  head
    (reduce
      (([ filtered, prev_delta ], evt) =>
        p (evt) ?
          [[ ...filtered, over (deltaTime) (add (prev_delta)) (evt) ], 0]
          : [ filtered, evt.deltaTime + prev_delta ])
      ([[], 0])
      (track)))

export const rejectEvents = curry ((p, track) =>
  filterEvents (complement (p)) (track))

// Drops events from tracks but recalculates deltaTimes to maintain
// synchronization with rest of tracks

export const dropEvents = curry ((n, track) =>
  trackWithoutAbsoluteDeltaTimes (
    trackDeltaTimesFromAbsolutes (
      drop (n) (trackWithAbsoluteDeltaTimes (track)))))

// --------------------- Sort events on each track -----------------------

export const sortEvents = (sequence) =>
  mapTracks
    (sortBy (prop ('absoluteDeltaTime')))
    (sequence)

 // --------------------------- Merge tracks -----------------------------

export const mergeTracks = (sequence) =>
  withoutAbsoluteDeltaTimes (
    deltaTimesFromAbsolutes ( 
      sortEvents (
        evolve ({ 
          tracks: (tracks) => [flatten (tracks)]
        }) (withAbsoluteDeltaTimes (sequence)))))
