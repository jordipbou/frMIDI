import { allPass, curry, is, has, propEq } from 'ramda'
import {
    SEQUENCE_NUMBER, TEXT, COPYRIGHT_NOTICE, TRACK_NAME,
    INSTRUMENT_NAME, LYRICS, MARKER, CUE_POINT, CHANNEL_PREFIX,
    END_OF_TRACK, TEMPO_CHANGE, SMPTE_OFFSET, TIME_SIGNATURE,
    KEY_SIGNATURE, SEQUENCER_SPECIFIC
  } from '../messages/meta.js'

// ------------------ MIDI File Meta Events predicates -------------------

export const seemsMetaEvent = (msg) =>
  allPass ([is (Object),
            propEq ('type', 'metaevent'),
            has ('metaType'),
            has ('data')])
          (msg)

export const metaTypeEq = curry ((type, msg) => 
  seemsMetaEvent (msg) ?
    propEq ('metaType') (type) (msg)
    : false)

export const isEndOfTrack = (msg) =>
  metaTypeEq (END_OF_TRACK) (msg)

export const isTempoChange = (msg) =>
  metaTypeEq (TEMPO_CHANGE) (msg)

