import { 
    isChannelMessage, isControlChange,
    isPitchBend, isPolyPressure, isProgramChange,
    hasNote, hasPressure, hasVelocity,
    seemsMessage
  } from '../predicates'
import { 
    assoc, curry, evolve, ifElse, lens,
    prop, slice, view
  } from 'ramda'

// ---------------- Generic property modification helpers ----------------

export const getByte = curry ((n, msg) =>
  msg.data [n])

export const setByte = curry ((n, v, msg) => 
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


export const timeStamp =
  lensWhen (seemsMessage)
           (prop ('timeStamp')) 
           (assoc ('timeStamp'))

export const deltaTime =
  lensWhen (seemsMessage)
           (prop ('deltaTime'))
           (assoc ('deltaTime'))

export const channel =
  lensWhen (isChannelMessage) 
           ((m) => getByte (0) (m) & 0xF)
           ((v, m) => setByte (0) ((getByte (0, m) & 0xF0) + v) (m))

export const note =
  lensWhen (hasNote) (getByte (1)) (setByte (1))

export const velocity =
  lensWhen (hasVelocity) (getByte (2)) (setByte (2))

export const pressure =
  lensWhen (hasPressure)
           (ifElse (isPolyPressure) (getByte (2)) (getByte (1)))
           ((v, m) => isPolyPressure (m) ?
                        setByte (2) (v) (m)
                        : setByte (1) (v) (m))

export const control =
  lensWhen (isControlChange) (getByte (1)) (setByte (1))

export const value =
  lensWhen (isControlChange) (getByte (2)) (setByte (2))

export const program =
  lensWhen (isProgramChange) (getByte (1)) (setByte (1))

export const pitchBend =
  lensWhen (isPitchBend)
           ((m) => (getByte (2) (m) << 7) + getByte (1) (m))
           ((v, m) => setByte (1) (v & 0x7F) (setByte (2) (v >> 7) (m)))

// ----------------------- Predicate helpers -----------------------------

export const lensP = curry((lens, pred, v) => 
  (msg) => pred (view (lens) (msg)) (v))  
