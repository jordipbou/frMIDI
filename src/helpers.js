import { channel, note, velocity } from './lenses.js'
import { isNote, isNoteOn, isNoteOff } from './predicates.js'
import { 
  leastNotesChannel, mpeZone, processMessage, seemsActiveNote
  } from './mpe.js'
import { 
  any, append, curry, equals, evolve, filter, head, 
  length, map, prop, range, set, view, without 
  } from 'ramda'
import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'

// ======================= Predicate helpers =============================

export const lensP = curry((lens, pred, v) => 
  (msg) => pred (view (lens) (msg)) (v)
)

export const toMPE = curry((m, c, findChannel = leastNotesChannel) =>
  rx.pipe (
    rxo.scan (([z, _], msg) => {
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
    rxo.map (([x, msg]) => msg)))
