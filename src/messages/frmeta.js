import { is } from 'ramda'
import { frNow } from '../utils.js'

// =================== frMIDI Meta Events generation =====================

// This messages will flow between some frMIDI operators, but not all of
// them will forward them and will never go out a MIDI output.

export const TIMING_EVENT = 0
export const TIME_DIVISION_EVENT = 1
export const SEQUENCE_EVENT = 2
export const BAR_EVENT = 3
export const BEAT_EVENT = 4
export const SUBDIVISION_EVENT = 5
export const REST_EVENT = 6
export const PATTERN_ITEM_EVENT = 7
export const PATTERN_EVENT = 8
export const EMPTY_EVENT = 9

export const frMeta = (type, data, timeStamp = 0) =>
({
  type: 'frmetaevent',
  timeStamp: timeStamp,
  metaType: type,
  data: is (Array) (data) ? [ ...data ] : [ data ]
})

export const timingEvent = 
  (now = frNow (), look_ahead_window = 150, ts = 0) =>
    frMeta (TIMING_EVENT, [now, look_ahead_window], ts)

export const timeDivisionEvent = (timeDivision, ts = 0) =>
  frMeta (TIME_DIVISION_EVENT, timeDivision, ts)

export const sequenceEvent = (sequence, ts = 0) =>
  frMeta (SEQUENCE_EVENT, sequence, ts)

export const barEvent = (ts = 0) =>
  frMeta (BAR_EVENT, [], ts)

export const beatEvent = (ts = 0) =>
  frMeta (BEAT_EVENT, [], ts)

export const subdivisionEvent = (ts = 0) =>
  frMeta (SUBDIVISION_EVENT, [], ts)

export const restEvent = (ts = 0) =>
  frMeta (REST_EVENT, [], ts)

export const patternItemEvent = (i, ts = 0) =>
  frMeta (PATTERN_ITEM_EVENT, i, ts)

export const patternEvent = (p, ts = 0) =>
  frMeta (PATTERN_EVENT, p, ts)

export const emptyEvent = (ts = 0) =>
  frMeta (EMPTY_EVENT, [], ts)
