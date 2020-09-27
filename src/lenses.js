import { 
  isChannelMessage, isChannelPressure, isControlChange,
  isPitchBend, isPolyPressure, isProgramChange,
  hasNote, hasPressure, hasVelocity,
  seemsMIDIMessage
} from './predicates.js'
import { 
  assoc, clone, curry, evolve, ifElse, lens,
  prop, slice 
} from 'ramda'

// ------------- Generic property modification helpers -------------

export let getByte = curry ((n, msg) =>
  msg.data [n])

export let setByte = curry ((n, v, msg) => 
  evolve ({
    data: ((d) => [...slice (0, n, d), v, ...slice (n + 1, Infinity, d)])
  }) (msg))

// --------------------------- Lenses ------------------------------

let lensWhen = curry ((p, v, s) =>
  lens (
    (msg) => p (msg) ? v (msg) : undefined,
    (v, msg) => p (msg) ? s (v, msg) : msg)
)

export let timeStamp =
  lensWhen (seemsMIDIMessage)
           (prop ('timeStamp')) 
           (assoc ('timeStamp'))

export let deltaTime =
  lensWhen (seemsMIDIMessage)
           (prop ('deltaTime'))
           (assoc ('deltaTime'))

export let channel =
  lensWhen (isChannelMessage) 
           ((m) => getByte (0) (m) & 0xF)
           ((v, m) => setByte (0) ((getByte (0, m) & 0xF0) + v) (m))

export let note =
  lensWhen (hasNote) (getByte (1)) (setByte (1))

export let velocity =
  lensWhen (hasVelocity) (getByte (2)) (setByte (2))

export let pressure =
  lensWhen (hasPressure)
           (ifElse (isPolyPressure) (getByte (2)) (getByte (1)))
           ((v, m) => isPolyPressure (m) ?
                        setByte (2) (v) (m)
                        : setByte (1) (v) (m))

export let control =
  lensWhen (isControlChange) (getByte (1)) (setByte (1))

export let value =
  lensWhen (isControlChange) (getByte (2)) (setByte (2))

export let program =
  lensWhen (isProgramChange) (getByte (1)) (setByte (1))

export let pitchBend =
  lensWhen (isPitchBend)
           ((m) => (getByte (2) (m) << 7) + getByte (1) (m))
           ((v, m) => setByte (1) (v & 0x7F) (setByte (2) (v >> 7) (m)))

