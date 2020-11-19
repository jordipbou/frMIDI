import { 
  isContinue, isMIDIClock, isStart, isStop 
} from '../predicates/predicates.js'
import { isEndOfTrack, isTempoChange } from '../predicates/meta.js'
import { isSequenceEvent, seemsfrMessage } from '../predicates/frmeta.js'
import { from } from '../messages'
import { sequenceEvent } from '../messages/frmeta.js'
import { 
  time, deltaTime, timeStamp, sequence as sequenceLens 
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
  clone, concat, complement, cond, curry, 
  dissoc, drop, dropWhile, dropRepeatsWith,
  either, evolve, F, filter, flatten, flip, forEach, 
  has, head, identity, is, isEmpty, isNil, last,
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

// --------------------- Operations on sequences -------------------------

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

export const addTime = (v, t) =>
  cond ([
    [seemsSequence, mapTracks (addTime)],
    [seemsTrack, (v) => last (mapAccum (flip (addTime)) (0) (v))],
    [seemsfrMessage, 
      always ([ t + v.deltaTime, assoc ('time') (t + v.deltaTime) (v) ])]
  ]) (v)

export const addDeltaTime = (v) =>
  cond ([
    [seemsSequence, mapTracks (addDeltaTime)],
    [seemsTrack, 
      pipe (
        mapAccum 
          ((a, e) => [e.time, set (deltaTime) (e.time - a) (e)]) (0),
        last)]
  ]) (v)

export const withoutTime = (v) =>
  cond ([
    [seemsSequence, mapTracks (withoutTime)],
    [seemsTrack, map (dissoc ('time'))],
    [seemsfrMessage, dissoc ('time')]
  ]) (v)

export const withoutDeltaTime = (v) =>
  cond ([
    [seemsSequence, mapTracks (withoutDeltaTime)],
    [seemsTrack, map (dissoc ('deltaTime'))],
    [seemsfrMessage, dissoc ('deltaTime')]
  ]) (v)

// ------------------------ Time division --------------------------------

export const setTrackTimeDivision = curry ((td, ttd, track) =>
  map 
    ((evt) => set (deltaTime) ((view (deltaTime) (evt)) * td / ttd) (evt))
    (track))

export const setTimeDivision = curry ((td, sequence) =>
  evolve ({
    timeDivision: always (td),
    tracks: 
      map (setTrackTimeDivision (td) (sequence.timeDivision))
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
  withoutTime (
    addDeltaTime (
      drop (n) (addTime (track)))))

// TODO: Map events to other event types based on a predicate.
// Also allows start/end event to change one to two different types,
// end event will be set on next event deltatime.
// Mappings are defined as:
// [ <mapping>, <mapping>, ... ]
// Where each mapping is:
// [ <predicate>, <singular_mapping> | [ <start_mapping>, <end_mapping> ] ]
// Where predicate is a function that accepts a message as parameter.
// Each mapping can be either a defined message or a function that
// receives original message to transform it.
export const applyEventMapping = (n) => (o) => (t) => {
  if (is (Function) (n)) {
    return append (set (deltaTime) (view (deltaTime) (o)) (n (o))) (t)
  } else {
    return append (set (deltaTime) (view (deltaTime) (o)) (n)) (t)
  }
}

export const mapTrackEvents = curry ((mappings, track) => {
  mappings = append ([ T, identity ]) (mappings)
  let mappedTrack = []
  let toAdd = []

  for (let i = 0; i < track.length; i++) {
    let old_event = track [i]

    if (view (deltaTime) (old_event) > 0 && toAdd.length !== 0) {
      mappedTrack = applyEventMapping (toAdd [0]) (old_event) (mappedTrack)
      old_event = set (deltaTime) (0) (old_event)
      for (let m = 1; m < toAdd.length; m++) {
        mappedTrack = applyEventMapping (toAdd [m]) (old_event) (mappedTrack)
      }
      toAdd = []
    }

    for (let j = 0; j < mappings.length; j++) {
      let predicate = mappings [j] [0]

      if (predicate (old_event)) {
        if (is (Array) (mappings [j] [1])) {
          mappedTrack = 
            applyEventMapping 
              (mappings [j] [1] [0]) 
              (old_event) 
              (mappedTrack)

          if (is (Function) (mappings [j] [1] [1])) {
            toAdd = append (mappings [j] [1] [1] (old_event)) (toAdd)
          } else {
            toAdd = append (mappings [j] [1] [1]) (toAdd)
          }
        } else {
          mappedTrack = 
            applyEventMapping 
              (mappings [j] [1]) 
              (old_event) 
              (mappedTrack)
        }

        break;
      }
    }
  }

  return mappedTrack
})

// --------------------- Sort events on each track -----------------------

export const sortEvents = (sequence) =>
  mapTracks
    (sortBy (prop ('time')))
    (sequence)

 // --------------------------- Merge tracks -----------------------------

export const mergeTracks = (sequence) =>
  mapTracks 
    (dropRepeatsWith ((a, b) => isEndOfTrack (a) && isEndOfTrack (b)))
    (withoutTime 
      (addDeltaTime 
        (sortEvents 
          (evolve ({ 
            tracks: (tracks) => [flatten (tracks)]
          }) (addTime (sequence))))))
