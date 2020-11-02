import { off } from '../messages/messages.js'
import { isNoteOn, isNoteOff } from '../predicates/predicates.js'
import { channel, note, lensP } from '../lenses/lenses.js'
import { 
    always, complement, cond, equals, filter, length, T, view, without 
  } from 'ramda'

// By using note offs in state we can send state directly as 
// messages to mute output on player stop
const genericNoteOff = (msg) =>
  off (view (note) (msg), 127, view (channel) (msg))

const noteIsPresent = (state) => (msg) =>
  complement (equals)
    (0)
    (length 
      (filter ((n) => view (note) (msg) === view (note) (n)
                   && view (channel) (msg) === view (channel) (n))
              (state)))
      
const processNoteOn = (state) => (msg) =>
  noteIsPresent (state) (msg) ?
    state
    : [...state, genericNoteOff (msg)]

const processNoteOff = (state) => (msg) =>
  without ([genericNoteOff (msg)]) (state)

export const processMessage = (state) => (msg) => 
  cond ([
    [isNoteOn, processNoteOn (state)],
    [isNoteOff, processNoteOff (state)],
    [T, always (state)]
  ]) (msg)
