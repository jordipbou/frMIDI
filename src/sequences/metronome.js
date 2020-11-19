import { 
  createLoop, createSequence, mapTrackEvents, setTimeDivision 
} from './sequences.js'
import { concatPatterns, pattern } from './patterns.js'
import { player } from './player.js'
import { on } from '../messages/messages.js'
import { endOfTrack } from '../messages/meta.js'
import { 
  barEvent, beatEvent, restEvent, subdivisionEvent 
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

export const meterPattern = (meterDef) => 
  adjust
    (0)
    (mapTrackEvents (meterMapping))
    (reduce
      (concatPatterns)
      (pattern ([]))
      (map 
        (pattern)
        (meterDef)))

export const meter = (meterDef, timeDivision = 24) =>
  player 
    (setTimeDivision 
      (timeDivision) 
      (createLoop 
        (createSequence 
          (...meterPattern (meterDef)))))

export const metronome = (meterDef, timeDivision = 24) =>
  rx_pipe (
    meter (meterDef, timeDivision),
    rxo_mergeMap (
        cond ([
          [isBarEvent, always (rx_of (on (48, 96, 9)))],
          [isBeatEvent, always (rx_of (on (51, 96, 9)))],
          [isSubdivisionEvent, always (rx_of (on (38, 96, 9)))],
          [isRestEvent, always (rx_NEVER)],
          [T, (msg) => rx_of (msg)]
        ])))
