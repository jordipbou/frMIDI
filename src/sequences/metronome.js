import { pattern } from './patterns.js'
import { 
    createLoop, createSequence, player, setTimeDivision 
  } from './sequences.js'
import { on } from '../messages/messages.js'
import { endOfTrack } from '../messages/meta.js'
import { 
    barEvent, beatEvent, restEvent, subdivisionEvent 
  } from '../messages/frmeta.js'
import {
    isBarEvent, isBeatEvent, isRestEvent, isSubdivisionEvent
  } from '../predicates/frmeta.js'
import { timeDivision } from '../lenses/lenses.js'
import { addIndex, always, cond, identity, map, T } from 'ramda'
import { pipe as rx_pipe, of as rx_of, NEVER as rx_NEVER } from 'rxjs'
import { mergeMap as rxo_mergeMap } from 'rxjs/operators'

export const mR = 0
export const mB = 1
export const mS = 2

export const meterSequence = (meterDef, timeDivision) => 
  setTimeDivision
    (timeDivision)
    (createLoop
      (createSequence
        (...pattern 
          (addIndex
            (map)
            ((v, i) => 
              v === 1 && i === 0 ?
                barEvent ()
                : v === 1 ?
                  beatEvent ()
                  : v === 2 ?
                    subdivisionEvent ()
                    : v === 0 ?
                      restEvent ()
                      : v)
            ([...meterDef, endOfTrack ()])))))

export const meter = (meterDef, timeDivision = 24) =>
  player (meterSequence (meterDef, timeDivision))

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
