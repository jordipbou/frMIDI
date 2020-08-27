import { 
  isChannelMessage, isChannelPressure, isControlChange,
  isPitchBend, isPolyPressure, isProgramChange,
  hasNote, hasPressure, hasVelocity,
  seemsMIDIMessageAsArray, seemsMIDIMessageAsObject
} from './predicates.js'
import { 
  assoc, clone, curry, ifElse, lens,
  prop, slice 
} from 'ramda'

// ------------- Generic property modification helpers -------------

export let getByte = curry ((n, msg) =>
  seemsMIDIMessageAsArray (msg) ?
    msg[n]
    : msg.data [n] 
)

export let setByte = curry ((n, v, msg) => 
  seemsMIDIMessageAsArray (msg) ?
    [...slice (0, n, msg), v, ...slice (n + 1, Infinity, msg)]
    : assoc ('data')
            (setByte (n, v, msg.data))
            (clone (msg))
)


// --------------------------- Lenses ------------------------------

let lensWhen = curry ((p, v, s) =>
  lens (
    (msg) => p (msg) ? v (msg) : undefined,
    (v, msg) => p (msg) ? s (v, msg) : msg)
)

export let timeStamp =
  lensWhen (seemsMIDIMessageAsObject) 
           (prop ('timeStamp')) 
           (assoc ('timeStamp'))

export let deltaTime =
  lensWhen (seemsMIDIMessageAsObject)
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
           ((m) => { /* TODO */ })
           ((v, m) => { /* TODO */ })

