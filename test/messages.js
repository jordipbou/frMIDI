const test = require ('ava')
import {
    as, cc, cont, cp, from, mc, msg, nrpn, off, on, 
    pb, pc, pp, rpn, rst, spp, ss, start, stop, 
    tc, tun, syx
  } from '../src/messages/messages.js'
import { 
    meta, endOfTrack, tempoChange, bpmChange 
  } from '../src/messages/meta.js'
import {
    SEQUENCE_EVENT, TIMING_EVENT, TIME_DIVISION_EVENT,
    BAR_EVENT, BEAT_EVENT, REST_EVENT, SUBDIVISION_EVENT,
    PATTERN_ITEM_EVENT, PATTERN_EVENT, EMPTY_EVENT,
    frMeta, sequenceEvent, timeDivisionEvent, timingEvent,
    barEvent, beatEvent, restEvent, subdivisionEvent,
    patternItemEvent, patternEvent, emptyEvent
  } from '../src/messages/frmeta.js'
import {
    controlEq, isActiveSensing,
    isContinue, isControlChange, isChannelPressure, 
    isMIDIClock, isMIDITimeCodeQuarterFrame, isNoteOff, 
    isNoteOn, isNRPN, isOnChannel, isPolyPressure, isPitchBend, 
    isProgramChange, isReset, isRPN, isSongPositionPointer, 
    isSongSelect, isStart, isStop,
    isSystemExclusive, isTuneRequest,
    noteEq, pitchBendEq, pressureEq, programEq, valueEq, velocityEq
  } from '../src/predicates'
import { channel } from '../src/lenses'
import { allPass, both, set } from 'ramda'

// =================== MIDI Message creation =======================

test ('MIDI Message creation', (t) => {
  t.deepEqual (
    msg ([145, 64, 96]), 
    { type: 'midimessage',
      timeStamp: 0,
      data: [145, 64, 96]})

  t.deepEqual (
    msg ([145, 64, 96], 25), 
    { type: 'midimessage',
      timeStamp: 25,
      data: [145, 64, 96]})

  t.deepEqual (
    msg ([145, 64, 96], 25), 
    { type: 'midimessage',
      timeStamp: 25,
      data: [145, 64, 96]})
})

test ('MIDI Message cloning', (t) => {
  let msgs = [ msg ([248]), msg ([144, 64, 96])]
  let combine = from (msgs)

  t.is (combine.timeStamp, msgs[0].timeStamp)
  t.deepEqual (combine.data, [248, 144, 64, 96])
})

// =================== MIDI Messages definition ====================

// -------------- Channel Voice messages generation ----------------

test ('Note Off message creation', (t) => {
  let preds = (n, v, ch) => 
    [isNoteOff, noteEq (n), velocityEq (v), isOnChannel (ch)]

  t.true (allPass (preds (77, 96, 0)) (off (77)))
  t.true (allPass (preds (77, 127, 0)) (off (77, 127)))
  t.true (allPass (preds (77, 127, 10)) (off (77, 127, 10)))
  
  t.true (allPass (preds (64, 96, 0)) (off ()))
})

test ('Note On message creation', (t) => {
  let preds = (n, v, ch) => 
    [isNoteOn, noteEq (n), velocityEq (v), isOnChannel (ch)]

  t.true (allPass (preds (77, 96, 0)) (on (77)))
  t.true (allPass (preds (77, 127, 0)) (on (77, 127)))
  t.true (allPass (preds (77, 127, 10)) (on (77, 127, 10)))

  t.true (allPass (preds (64, 96, 0)) (on ()))
})

test ('Poly Pressure message creation', (t) => {
  let preds = (n, v, ch) => 
    [isPolyPressure, noteEq (n), 
     pressureEq (v), isOnChannel (ch)]

  t.true (allPass (preds (77, 96, 0)) (pp (77)))
  t.true (allPass (preds (77, 127, 0)) (pp (77, 127)))
  t.true (allPass (preds (77, 127, 10)) (pp (77, 127, 10)))

  t.true (allPass (preds (64, 96, 0)) (pp ()))
})

test ('Control Change message creation', (t) => {
  let preds = (n, v, ch) => 
    [isControlChange, controlEq (n), 
     valueEq (v), isOnChannel (ch)]

  t.true (allPass (preds (32, 127, 0)) (cc (32, 127)))
  t.true (allPass (preds (32, 127, 10)) (cc (32, 127, 10)))

  t.true (allPass (preds (1, 127, 0)) (cc ()))
  t.true (allPass (preds (32, 127, 0)) (cc (32)))
})

test ('Program Change message creation', (t) => {
  let preds = (p, ch) => 
    [isProgramChange, programEq (p), isOnChannel (ch)]

  t.true (allPass (preds (18, 0)) (pc (18)))
  t.true (allPass (preds (18, 10)) (pc (18, 10)))

  t.true (allPass (preds (0 ,0)) (pc ()))
})

test ('Channel Pressure message creation', (t) => {
  let preds = (p, ch) =>
    [isChannelPressure, pressureEq (p), isOnChannel (ch)]

  t.true (allPass (preds (96, 0)) (cp (96)))
  t.true (allPass (preds (96, 10)) (cp (96, 10)))

  t.true (allPass (preds (96, 0)) (cp ()))
})

test ('Pitch Bend message creation', (t) => {
  let preds = (pb, ch) =>
    [isPitchBend, pitchBendEq (pb), isOnChannel (ch)]

  t.true (allPass (preds (8192, 0)) (pb (8192)))
  t.true (allPass (preds (8192, 10)) (pb (8192, 10)))

  t.true (allPass (preds (8192, 0)) (pb ()))
})

test ('RPN message creation', (t) => {
  let preds = (n, v, ch) =>
    [isRPN, isOnChannel (ch)]

  t.true (allPass (preds (245, 1, 0)) (rpn (245, 1)))
  t.true (allPass (preds (245, 1, 3)) (rpn (245, 1, 3)))

  t.true (allPass (preds (0, 8192, 0)) (rpn ()))
})

test ('NRPN message creation', (t) => {
  let preds = (n, v, ch) =>
    [isNRPN, isOnChannel (ch)]

  t.true (allPass (preds (245, 1, 0)) (nrpn (245, 1)))
  t.true (allPass (preds (245, 1, 3)) (nrpn (245, 1, 3)))

  t.true (allPass (preds (0, 8192, 0)) (nrpn ()))
})

// --------- Channel Voice messages modification helpers -----------

test ('Change channel modification helper', (t) => {
  let msg = on (64)

  t.true (isOnChannel (0) (msg))
  t.true (isOnChannel (5) (set (channel) (5) (msg)))
})

// -------------- System common messages generation ----------------

test ('System Common messages creation', (t) => {
  t.true (isSystemExclusive (syx ([0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7F, 0x00, 0x41])))
  t.true (isMIDITimeCodeQuarterFrame (tc (12, 48)))
  t.true (isSongPositionPointer (spp (100)))
  t.true (isSongSelect (ss (18)))
  t.true (isTuneRequest (tun ()))
})

// ------------ System Real Time messages generation ---------------

test ('System Real Time messages creation', (t) => {
  t.true (isMIDIClock (mc ()))
  t.true (isStart (start ()))
  t.true (isContinue (cont ()))
  t.true (isStop (stop ()))
  t.true (isActiveSensing (as ()))
  t.true (isReset (rst ()))
})

//test ('Panic message creation', (t) => {
//  // TODO: Useful having parsing for implementing this one
//})

// ================= MIDI File Meta Events generation ====================

test ('MIDI File Meta Event message creation', (t) => {
  t.deepEqual (
    meta (88, [4, 2, 48, 8]),
    { 
      type: 'metaevent',
      timeStamp: 0,
      metaType: 88,
      data: [ 4, 2, 48, 8 ]
    })

  t.deepEqual (
    meta (88, 96),
    {
      type: 'metaevent',
      timeStamp: 0,
      metaType: 88,
      data: [96]
    })
})

test ('End of track MIDI File meta message', (t) => {
  t.deepEqual (
    endOfTrack (), 
    {
      type: 'metaevent',
      timeStamp: 0,
      metaType: 47,
      data: []
    })
})

test ('Set tempo (as qnpm) MIDI File meta message', (t) => {
  t.deepEqual (
    tempoChange (60000),
    {
      type: 'metaevent',
      timeStamp: 0,
      metaType: 81,
      data: [ 60000 ]
    })
})

test ('Set tempo (as bpm) MIDI File meta message', (t) => {
  t.deepEqual (
    bpmChange (120),
    {
      type: 'metaevent',
      timeStamp: 0,
      metaType: 81,
      data: [ 500000 ]
    })
})

// =================== frMIDI Meta Events generation =====================

test ('frMIDI Meta Event message creation', (t) => {
  t.deepEqual (
    frMeta (0, [10, 45]),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: 0,
      data: [10, 45]
    })

  t.deepEqual (
    frMeta (1, { a: 1, b: 2 }, 15, 26),
    {
      type: 'frmetaevent',
      timeStamp: 15,
      metaType: 1,
      data: [ { a: 1, b: 2 } ]
    })
})

test ('frMIDI timing Meta Event', (t) => {
  t.deepEqual (
    timingEvent (100, 150),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: TIMING_EVENT,
      data: [100, 150]
    })
})

test ('frMIDI timeDivision Meta Event', (t) => {
  t.deepEqual (
    timeDivisionEvent (48),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: TIME_DIVISION_EVENT,
      data: [ 48 ]
    })
})

test ('frMIDI sequence Meta Event', (t) => {
  t.deepEqual (
    sequenceEvent ({ timeDivision: 24, formatType: 1, tracks: [[]] }),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: SEQUENCE_EVENT,
      data: [{ timeDivision: 24, formatType: 1, tracks: [[]] }]
    })
})

test ('frMIDI bar event', (t) => {
  t.deepEqual (
    barEvent (),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: BAR_EVENT,
      data: [ ]
    })
})

test ('frMIDI beat event', (t) => {
  t.deepEqual (
    beatEvent (),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: BEAT_EVENT,
      data: [ ]
    })
})

test ('frMIDI subdivision event', (t) => {
  t.deepEqual (
    subdivisionEvent (),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: SUBDIVISION_EVENT,
      data: [ ]
    })
})

test ('frMIDI rest event', (t) => {
  t.deepEqual (
    restEvent (),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: REST_EVENT,
      data: [ ]
    })
})

test ('frMIDI pattern item event', (t) => {
  t.deepEqual (
    patternItemEvent (1),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: PATTERN_ITEM_EVENT,
      data: [ 1 ]
    })
})

test ('frMIDI empty event', (t) => {
  t.deepEqual (
    emptyEvent (),
    {
      type: 'frmetaevent',
      timeStamp: 0,
      metaType: EMPTY_EVENT,
      data: []
    })
})
