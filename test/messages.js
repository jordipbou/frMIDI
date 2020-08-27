const test = require ('ava')
const {
  as, cc, cont, cp, from, mc, msg, nrpn, off, on, 
  pb, pc, pp, rpn, rst, spp, ss, start, stop, tc, tun, syx
} = require ('../../src/frMIDI/messages.js')
const {
  controlEq, isActiveSensing,
  isContinue, isControlChange, isChannelPressure, 
  isMIDIClock, isMIDITimeCodeQuarterFrame, isNoteOff, 
  isNoteOn, isNRPN, isOnChannel, isPolyPressure, isPitchBend, 
  isProgramChange, isReset, isRPN, isSongPositionPointer, 
  isSongSelect, isStart, isStop,
  isSystemExclusive, isTuneRequest,
  noteEq, pitchBendEq, pressureEq, programEq, valueEq, velocityEq
} = require ('../../src/frMIDI/predicates.js')
const { channel } = require ('../../src/frMIDI/lenses.js')
const { allPass, both, set } = require ('ramda')

// =================== MIDI Message creation =======================

test ('MIDI Message creation', t => {
  t.deepEqual (
    msg ([145, 64, 96]), 
    { type: 'midimessage',
      timeStamp: 0,
      deltaTime: 0,
      data: [145, 64, 96]})

  t.deepEqual (
    msg ([145, 64, 96], 25), 
    { type: 'midimessage',
      timeStamp: 25,
      deltaTime: 0,
      data: [145, 64, 96]})

  t.deepEqual (
    msg ([145, 64, 96], 25, 100), 
    { type: 'midimessage',
      timeStamp: 25,
      deltaTime: 100,
      data: [145, 64, 96]})
})

test ('MIDI Message cloning', t => {
  let msgs = [ msg ([248]), msg ([144, 64, 96])]
  let combine = from (msgs)

  t.is (combine.timeStamp, msgs[0].timeStamp)
  t.is (combine.deltaTime, msgs[0].deltaTime)
  t.deepEqual (combine.data, [248, 144, 64, 96])
})

// =================== MIDI Messages definition ====================

// -------------- Channel Voice messages generation ----------------

test ('Note Off message creation', t => {
  let preds = (n, v, ch) => 
    [isNoteOff, noteEq (n), velocityEq (v), isOnChannel (ch)]

  t.true (allPass (preds (77, 96, 0)) (off (77)))
  t.true (allPass (preds (77, 127, 0)) (off (77, 127)))
  t.true (allPass (preds (77, 127, 10)) (off (77, 127, 10)))
})

test ('Note On message creation', t => {
  let preds = (n, v, ch) => 
    [isNoteOn, noteEq (n), velocityEq (v), isOnChannel (ch)]

  t.true (allPass (preds (77, 96, 0)) (on (77)))
  t.true (allPass (preds (77, 127, 0)) (on (77, 127)))
  t.true (allPass (preds (77, 127, 10)) (on (77, 127, 10)))
})

test ('Poly Pressure message creation', t => {
  let preds = (n, v, ch) => 
    [isPolyPressure, noteEq (n), 
     pressureEq (v), isOnChannel (ch)]

  t.true (allPass (preds (77, 96, 0)) (pp (77)))
  t.true (allPass (preds (77, 127, 0)) (pp (77, 127)))
  t.true (allPass (preds (77, 127, 10)) (pp (77, 127, 10)))
})

test ('Control Change message creation', t => {
  let preds = (n, v, ch) => 
    [isControlChange, controlEq (n), 
     valueEq (v), isOnChannel (ch)]

  t.true (allPass (preds (32, 127, 0)) (cc (32, 127)))
  t.true (allPass (preds (32, 127, 10)) (cc (32, 127, 10)))
})

test ('Program Change message creation', t => {
  let preds = (p, ch) => 
    [isProgramChange, programEq (p), isOnChannel (ch)]

  t.true (allPass (preds (18, 0)) (pc (18)))
  t.true (allPass (preds (18, 10)) (pc (18, 10)))
})

test ('Channel Pressure message creation', t => {
  let preds = (p, ch) =>
    [isChannelPressure, pressureEq (p), isOnChannel (ch)]

  t.true (allPass (preds (96, 0)) (cp (96)))
  t.true (allPass (preds (96, 10)) (cp (96, 10)))
})

test ('Pitch Bend message creation', t => {
  let preds = (pb, ch) =>
    [isPitchBend, pitchBendEq (pb), isOnChannel (ch)]

  t.true (allPass (preds (8192, 0)) (pb (8192)))
  t.true (allPass (preds (8192, 10)) (pb (8192, 10)))
})

test ('RPN message creation', t => {
  let preds = (n, v, ch) =>
    [isRPN, isOnChannel (ch)]

  t.true (allPass (preds (245, 1, 0)) (rpn (245, 1)))
  t.true (allPass (preds (245, 1, 3)) (rpn (245, 1, 3)))
})

test ('NRPN message creation', t => {
  let preds = (n, v, ch) =>
    [isNRPN, isOnChannel (ch)]

  t.true (allPass (preds (245, 1, 0)) (nrpn (245, 1)))
  t.true (allPass (preds (245, 1, 3)) (nrpn (245, 1, 3)))
})

// --------- Channel Voice messages modification helpers -----------

test ('Change channel modification helper', t => {
  let msg = on (64)

  t.true (isOnChannel (0) (msg))
  t.true (isOnChannel (5) (set (channel) (5) (msg)))
})

// -------------- System common messages generation ----------------

test ('System Common messages creation', t => {
  t.true (isSystemExclusive (syx ([0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7F, 0x00, 0x41])))
  t.true (isMIDITimeCodeQuarterFrame (tc (12, 48)))
  t.true (isSongPositionPointer (spp (100)))
  t.true (isSongSelect (ss (18)))
  t.true (isTuneRequest (tun ()))
})

// ------------ System Real Time messages generation ---------------

test ('System Real Time messages creation', t => {
  t.true (isMIDIClock (mc ()))
  t.true (isStart (start ()))
  t.true (isContinue (cont ()))
  t.true (isStop (stop ()))
  t.true (isActiveSensing (as ()))
  t.true (isReset (rst ()))
})

//test ('Panic message creation', t => {
//  // TODO: Useful having parsing for implementing this one
//})
