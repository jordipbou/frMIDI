import { 
  asNoteOff, isChannelPressure,
  isNote, isNoteOn, isPitchBend, isPolyPressure, isTimbreChange
  } from './predicates.js'
import { 
  channel, note, pitchBend, pressure, value, velocity 
  } from './lenses.js'
import { 
  always, allPass, any, anyPass, append, both, complement, cond, countBy,
  evolve, filter, head, includes, length,
  map, propEq, range, sort, T, view, without
  } from 'ramda'

// ------------------------ MPE State Objects ----------------------------

export const mpeNote = (msg) => ({
  note: view (note) (msg),
  channel: view (channel) (msg),
  velocity: view (velocity) (msg),
  pitchBend: 0,
  timbre: 0,
  pressure: view (velocity) (msg)
})

export const mpeZone = (m, n) =>
  m === 0 && n < 16 ?
    { // Lower Zone
      masterChannel: 0,
      memberChannels: n,
      zoneSize: n + 1,
      channels: range (1, n + 1),
      activeNotes: [] // In order as they arrive
    }
    : m === 15 && n < 16 ?
      { // Upper zone
        masterChannel: 15,
        memberChannels: n,
        zoneSize: n + 1,
        channels: range (15 - n, 15),
        activeNotes: []
      }
      : undefined

// ------------------------- MPE Predicates ------------------------------

export const isLowerZone = (mpeZone) =>
  mpeZone.masterChannel === 0

export const isUpperZone = (mpeZone) =>
  mpeZone.masterChannel === 15

export const isOnZone = (mpeZone) => (msg) =>
  includes (view (channel) (msg)) (mpeZone.channels)

export const isOnMasterChannel = (mpeZone) => (msg) =>
  view (channel) (msg) === mpeZone.masterChannel

export const isActiveNote = (mpeZone) => (msg) => 
  isNote (msg) ?
    any (both (propEq ('note') (view (note) (msg)))
              (propEq ('channel') (view (channel) (msg))))
        (mpeZone.activeNotes)
    : false

export const seemsActiveNote = (mpeZone) => (msg) =>
  isNote (msg) ?
    any (propEq ('note') (view (note) (msg))) 
        (mpeZone.activeNotes)
    : false

// ---------------------- Processing functions ---------------------------

export const processNoteOnMessage = (mpeZone) => (msg) =>
  isActiveNote (mpeZone) (msg) ?
    evolve ({
      activeNotes:
        map (
          (n) => 
            n.note === view (note) (msg) 
            && n.channel === view (channel) (msg) ?
              evolve ({
                velocity: always (view (velocity) (msg)),
                pressure: always (view (velocity) (msg))
              }) (n)
              : n)
    }) (mpeZone)
    : evolve ({
        activeNotes: append (mpeNote (msg))
      }) (mpeZone)

export const processNoteOffMessage = (mpeZone) => (msg) =>
  evolve ({
    activeNotes:
      without 
        ([head 
          (filter 
            (both (propEq ('note') (view (note) (msg)))
                  (propEq ('channel') (view (channel) (msg))))
            (mpeZone.activeNotes))])
  }) (mpeZone)

export const processChannelPressureMessage = (mpeZone) => (msg) =>
  evolve ({
    activeNotes:
      map ((n) => n.channel === view (channel) (msg) ?
                    evolve ({ 
                      pressure: always (view (pressure) (msg)) 
                    }) (n)
                    : n)
  }) (mpeZone)

export const processTimbreMessage = (mpeZone) => (msg) =>
  evolve ({
    activeNotes:
      map ((n) => n.channel === view (channel) (msg) ?
                    evolve ({
                      timbre: always (view (value) (msg))
                    }) (n)
                    : n)
  }) (mpeZone)

export const processPitchBendMessage = (mpeZone) => (msg) =>
  evolve ({
    activeNotes:
      map ((n) => n.channel === view (channel) (msg) ?
                    evolve ({
                      pitchBend: always (view (pitchBend) (msg))
                    }) (n)
                    : n)
  }) (mpeZone)

const zonePred = (mpeZone) => (predicate) =>
  allPass ([
    isOnZone (mpeZone), 
    complement (isOnMasterChannel (mpeZone)),
    predicate ])

export const processMessage = (mpeZone) => 
  (msg, pred = zonePred (mpeZone)) =>
    cond ([
      [pred (isNoteOn), processNoteOnMessage (mpeZone)],
      [pred (asNoteOff), processNoteOffMessage (mpeZone)],
      [pred (isChannelPressure), processChannelPressureMessage (mpeZone)],
      [pred (isTimbreChange), processTimbreMessage (mpeZone)],
      [pred (isPitchBend), processPitchBendMessage (mpeZone)],
      [T, always (mpeZone)]
    ]) (msg)

// ---------------------------- toMPE ------------------------------------

// Sort channels by note usage (ascending) and use first one 
export const leastNotesChannel = (mpeZone) => 
  head (
    head (
      sort ((a, b) => a [1] - b [1])
           (map ((c) => [c, length (filter ((n) => n.channel === c)
                                           (mpeZone.activeNotes))])
                (mpeZone.channels))))

