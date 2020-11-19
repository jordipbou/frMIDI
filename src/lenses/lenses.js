import { 
    isChannelMessage, isControlChange,
    isPitchBend, isPolyPressure, isProgramChange,
    hasNote, hasPressure, hasVelocity,
    seemsMessage
  } from '../predicates/predicates.js'
import {
    isTempoChange, seemsMetaEvent
  } from '../predicates/meta.js'
import {
    isSequenceEvent, isTimeDivisionEvent, isTimingEvent, seemsfrMetaEvent
  } from '../predicates/frmeta.js'
import { 
    anyPass, assoc, curry, evolve, ifElse, lens,
    prop, slice, view
  } from 'ramda'

// ---------------- Generic property modification helpers ----------------

export const getData = curry ((n, msg) =>
  msg.data [n])

export const setData = curry ((n, v, msg) => 
  evolve ({
    data: ((d) => [...slice (0, n, d), v, ...slice (n + 1, Infinity, d)])
  }) (msg))

// ------------------------------ Lenses ---------------------------------

// Creates a lens object from the getter and the setter only if the 
// received MIDI message passes the predicate.

export const lensWhen = curry ((p, v, s) => (msg) =>
  lens (
    (msg) => p (msg) ? v (msg) : undefined,
    (v, msg) => p (msg) ? s (v, msg) : msg
  ) (msg))

export const data0 =
  lensWhen (anyPass ([seemsMessage, seemsMetaEvent, seemsfrMetaEvent]))
           (getData (0))
           (setData (0))

export const timeStamp =
  lensWhen (anyPass ([seemsMessage, seemsMetaEvent, seemsfrMetaEvent]))
           (prop ('timeStamp')) 
           (assoc ('timeStamp'))

export const deltaTime =
  lensWhen (anyPass ([seemsMessage, seemsMetaEvent, seemsfrMetaEvent]))
           (prop ('deltaTime'))
           (assoc ('deltaTime'))

export const time =
  lensWhen (anyPass ([seemsMessage, seemsMetaEvent, seemsfrMetaEvent]))
           (prop ('time'))
           (assoc ('time'))

export const channel =
  lensWhen (isChannelMessage) 
           ((m) => getData (0) (m) & 0xF)
           ((v, m) => setData (0) ((getData (0, m) & 0xF0) + v) (m))

export const note =
  lensWhen (hasNote) (getData (1)) (setData (1))

export const velocity =
  lensWhen (hasVelocity) (getData (2)) (setData (2))

export const pressure =
  lensWhen (hasPressure)
           (ifElse (isPolyPressure) (getData (2)) (getData (1)))
           ((v, m) => isPolyPressure (m) ?
                        setData (2) (v) (m)
                        : setData (1) (v) (m))

export const control =
  lensWhen (isControlChange) (getData (1)) (setData (1))

export const value =
  lensWhen (isControlChange) (getData (2)) (setData (2))

export const program =
  lensWhen (isProgramChange) (getData (1)) (setData (1))

export const pitchBend =
  lensWhen (isPitchBend)
           ((m) => (getData (2) (m) << 7) + getData (1) (m))
           ((v, m) => setData (1) (v & 0x7F) (setData (2) (v >> 7) (m)))

// ----------------------- Predicate helpers -----------------------------

export const lensP = curry((lens, pred, v) => 
  (msg) => pred (view (lens) (msg)) (v))  

// ------------------ Lenses for MIDI File Meta events -------------------

export const tempo =
  lensWhen (isTempoChange) (getData (0)) (setData (0))

// -------------------- Lenses for frMIDI Meta events --------------------

export const timing =
  lensWhen (isTimingEvent) (getData (0)) (setData (0))

export const timeDivision =
  lensWhen (isTimeDivisionEvent) (getData (0)) (setData (0))

export const lookAhead =
  lensWhen (isTimingEvent) (getData (1)) (setData (1))

export const sequence =
  lensWhen (isSequenceEvent) (getData (0)) (setData (0))
