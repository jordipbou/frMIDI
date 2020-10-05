import { 
    asNoteOff, isChannelPressure,
    isNote, isNoteOn, isPitchBend, isPolyPressure, isTimbreChange
  } from '../predicates'
import { 
    channel, note, pitchBend, pressure, value, velocity 
  } from '../lenses'
import { 
    always, allPass, any, anyPass, append, assoc,
    both, complement, cond, countBy, curry,
    evolve, filter, fromPairs, head, includes, length,
    map, path, propEq, range, sort, T, view, without, xprod, zip
  } from 'ramda'
import {
    pipe as rx_pipe
  } from 'rxjs'
import {
    map as rxo_map,
    scan as rxo_scan
  } from 'rxjs/operators'

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

// ------------------------ toMPE algorithms -----------------------------

// Helper function to find notes per channel on mpe zone
export const notesPerChannel = (mpeZone) =>
  map ((c) => [c, length (filter ((n) => n.channel === c)
                                 (mpeZone.activeNotes))])
      (mpeZone.channels)

// Algorithm: select channel on mpe zone as the one with least notes -----

// Sort channels by note usage (ascending) and use first one 
export const leastNotesPerChannel = (mpeZone) => (msg) =>
  head (
    head (
      sort ((a, b) => a [1] - b [1])
           (notesPerChannel (mpeZone))))


// Algorithm: select channel based on key ranges with priorities ---------

// TODO: Add lower / higher note priority (weight)

// Uses the following data structure to define key ranges:
// [{ channel: n, min: n, max: n, weight: n }]
// Where:
// - channel -> the channel of the mpe zone that this key range will
//              be mapped to
// - min -> minimum note value that this range represents (included)
// - max -> maximum note value that this range represents (included)
// - weight -> relative priority to sort key ranges 

// Helper function to add notes per channel to key ranges
export const addNotes = (notesxchannel) => (v) => 
  assoc ('notes') 
        (fromPairs (notesxchannel) [v.channel]) (v)

// Always prefer empty channels to weight
export const byNotesAndWeight = (a, b) =>
  a.notes === b.notes ?
    b.weight - a.weight
    : a.notes - b.notes

// Select channel filtering key ranges that the note belongs to and
// then sort by weight and number of notes on the channel.
export const channelByKeyRange = (keyRanges) => (mpeZone) => (msg) => {
  let msg_note = view (note) (msg)
  let noteInRange = (n) => (v) => v.min <= n && v.max >= n

  return path ([0, 'channel'])
              (sort (byNotesAndWeight)
                    (map (addNotes (notesPerChannel (mpeZone)))
                         (filter (noteInRange (msg_note)) 
                                 (keyRanges))))
}

// ------------------ Transform non-mpe data to mpe ----------------------

export const toMPE = curry ((m, c, findChannel = leastNotesPerChannel) =>
  rx_pipe (
    rxo_scan (([z, _], msg) => {
      if (isNoteOn (msg)) {
        let ch = findChannel (z) (msg)
        let mod_msg = set (channel) (ch) (msg)
        return [processMessage (z) (mod_msg), mod_msg]
      } else if (isNoteOff (msg)) {
        let n = view (note) (msg)
        let ch = prop ('channel') (head (filter ((an) => an.note === n)
                                                (z.activeNotes)))
        let mod_msg = set (channel) (ch) (msg)
        return [processMessage (z) (mod_msg), mod_msg]
      } else {
        return [z, msg]
      }
    }, [mpeZone (m, c), null]),
    rxo_map (([x, msg]) => msg)))
