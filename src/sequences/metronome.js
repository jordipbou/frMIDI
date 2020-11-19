import { 
  createLoop, createSequence, mapTrackEvents, mapTracks, setTimeDivision 
} from './sequences.js'
import { concatPatterns, pattern } from './patterns.js'
import { player } from './player.js'
import { on } from '../messages/messages.js'
import { endOfTrack } from '../messages/meta.js'
import { 
  barEvent, beatEvent, emptyEvent, restEvent, subdivisionEvent 
} from '../messages/frmeta.js'
import {
  isBarEvent, isBeatEvent, isRestEvent, isSubdivisionEvent
} from '../predicates/frmeta.js'
import { data0, lensP, timeDivision } from '../lenses/lenses.js'
import { 
  addIndex, adjust, always, cond, equals, identity, map, pipe, reduce, T 
} from 'ramda'
import { pipe as rx_pipe, of as rx_of, NEVER as rx_NEVER } from 'rxjs'
import { mergeMap as rxo_mergeMap } from 'rxjs/operators'

export const mR = 0
export const mB = 1
export const mS = 2

export const meterMapping = [
  [ lensP (data0) (equals) (0), restEvent () ],
  [ lensP (data0) (equals) (1), barEvent () ],
  [ lensP (data0) (equals) (2), beatEvent () ],
  [ lensP (data0) (equals) (3), subdivisionEvent () ]
]

export const meter = 
  (timeDivision, mapping = meterMapping) =>
    (...meterDef) =>
      player 
        (setTimeDivision 
          (timeDivision) 
          (mapTracks
            (mapTrackEvents (mapping))
            (createLoop 
              (createSequence 
                (...pattern (...meterDef))))))

export const metronomeMap = [
  [ lensP (data0) (equals) (0), emptyEvent () ],
  [ lensP (data0) (equals) (1), on (48, 96, 9) ],
  [ lensP (data0) (equals) (2), on (51, 96, 9) ],
  [ lensP (data0) (equals) (3), on (38, 96, 9) ]
]

export const metronome = 
  (timeDivision, mapping = metronomeMap) =>
    (...meterDef) =>
      meter (timeDivision, mapping) (...meterDef)

