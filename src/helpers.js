import { channel, note, velocity } from '../src/lenses.js'
import { isNote, isNoteOn, isNoteOff } from '../src/predicates.js'
import { 
  any, append, curry, equals, evolve, filter, head, 
  length, map, range, set, view, without 
  } from 'ramda'
import { pipe } from 'rxjs'
import { map as rxo_map, scan } from 'rxjs/operators'

// ======================= Predicate helpers =============================

export const lensP = curry((lens, pred, v) => 
  (msg) => pred (view (lens) (msg)) (v)
)

// ============================= MPE =====================================

// - current active notes 
// - current used channels (total can be equal to total notes or less)

// mpeNote:
//   note: n
//   channel: c
//   velocity: v
//   pitchBend: pb
//   timbre: t
//   pressure: p

export const mpeNote = (m) => ({
  note: view (note) (m),
  channel: view (channel) (m),
  velocity: view (velocity) (m),
  pitchBend: 0.0,
  timbre: 0.0,
  pressure: view (velocity) (m)
})

export const mpeZone = (m, z) => ({
  masterChannel: m,
  zoneSize: z,
  channels: range (m, m + z),
  activeNotes: [] // In order as they arrive
})

export const getNextChannel = (mpeZone) => {
  let ch = head (without (map (n => n.channel) (mpeZone.activeNotes))
                         (mpeZone.channels))

  if (!ch) {
    if (length (mpeZone.activeNotes) > 0) {
      ch = head (mpeZone.activeNotes).channel
    } else {
      ch = mpeZone.masterChannel
    }
  }

  return ch
}

export const addNote = (mpeZone) => (m) => {
  let ch = getNextChannel (mpeZone)
  let msg = set (channel) (ch) (m)
  let n = mpeNote (msg)
  let z = evolve ({ activeNotes: append (n) }) (mpeZone)

  return [z, msg]
}

export const removeNote = (mpeZone) => (m) => {
  let n = head (filter ((v) => v.note === view (note) (m))
                       (mpeZone.activeNotes))
  let msg = set (channel) (n.channel) (m)
  let z = evolve ({ activeNotes: without ([n]) }) (mpeZone)

  return [z, msg]
}

export const isActiveNote = (mpeZone) => (m) =>
  any (n => n.note === view (note) (m)) 
      (mpeZone.activeNotes)

export const processNote = (mpeZone) => (m) => {
  if (isNote (m)) {
    if (isNoteOn (m) && !isActiveNote (mpeZone) (m)) {
      return addNote (mpeZone) (m)
    } else if (isNoteOff (m) && isActiveNote (mpeZone) (m)) {
      return removeNote (mpeZone) (m) 
    } 
  }

  return [mpeZone, m]
}

export const toMPE = (masterChannel, zoneSize) => 
  pipe (
    scan (([zone, _], msg) => processNote (zone) (msg), 
          [mpeZone (masterChannel, zoneSize), null]),
    rxo_map (([_, msg]) => msg)
  )
