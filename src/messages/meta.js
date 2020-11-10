import { BPM2QNPM } from '../utils.js'
import { is } from 'ramda'

// ================= MIDI File Meta Events generation ====================

// This messages will flow freely around frMIDI operators, but will no
// pass thru a MIDI output.

export const meta = (metaType, data, timeStamp = 0) => 
({ 
	type: 'metaevent', 
	timeStamp: timeStamp,
  metaType: metaType,
	data: is (Array) (data) ? [ ...data ] : [ data ]
})

export const SEQUENCE_NUMBER = 0
export const TEXT = 1
export const COPYRIGHT_NOTICE = 2
export const TRACK_NAME = 3
export const INSTRUMENT_NAME = 4
export const LYRICS = 5
export const MARKER = 6
export const CUE_POINT = 7
export const CHANNEL_PREFIX = 32 
export const END_OF_TRACK = 47 
export const TEMPO_CHANGE = 81 
export const SMPTE_OFFSET = 84
export const TIME_SIGNATURE = 88
export const KEY_SIGNATURE = 89
export const SEQUENCER_SPECIFIC = 127

export const endOfTrack = (timeStamp = 0) =>
  meta (47, [], timeStamp)
  
export const tempoChange = (qnpm, timeStamp = 0) =>
  meta (81, [qnpm], timeStamp)

export const bpmChange = (bpm, timeStamp = 0) =>
  meta (81, BPM2QNPM (bpm), timeStamp)
