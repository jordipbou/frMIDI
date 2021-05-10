const test = require ('ava')
import * as P from '../src/predicates/predicates.js'
import * as M from '../src/predicates/meta.js'
import * as F from '../src/predicates/frmeta.js'
import { msg } from '../src/messages/messages.js'
import { meta } from '../src/messages/meta.js'
import { 
    sequenceEvent, timeDivisionEvent, timingEvent ,
    patternItemEvent, patternEvent
  } from '../src/messages/frmeta.js'
import { allPas } from 'ramda'
import { from } from 'rxjs'
import { filter } from 'rxjs/operators'

test ('seems a MIDI message', (t) => {
  t.false (P.seemsMessage (null))
  t.false (P.seemsMessage (undefined))
  t.false (P.seemsMessage ({}))
  t.false (P.seemsMessage ({ type: 'midimessage' }))
  t.false (P.seemsMessage ({ data: [144, 64, 96] }))
  t.false (P.seemsMessage (msg ([])))
  t.false (P.seemsMessage (['test']))
  t.false (P.seemsMessage ([248, 'test']))
  t.false (P.seemsMessage ([{}]))
  t.false (P.seemsMessage ([248, {}]))
  t.true (P.seemsMessage (msg ([248])))
  t.true (P.seemsMessage (msg ([144, 64, 96])))
})

test ('dataEq', (t) => {
  t.false (P.dataEq ([144, 64, 96]) (null))
  t.false (P.dataEq ([144, 64, 96]) (undefined))
  t.false (P.dataEq ([144, 64, 96]) ([]))
  t.false (P.dataEq ([144, 64, 96]) ({}))
  t.false (P.dataEq ([144, 64, 96]) ([248]))
  t.true (P.dataEq ([144, 64, 96]) (msg ([144, 64, 96])))
})

test ('byteEq', (t) => {
  t.false (P.byteEq (0) (248) (null))
  t.false (P.byteEq (0) (248) (undefined))
  t.false (P.byteEq (0) (248) ([]))
  t.false (P.byteEq (0) (248) ({}))
  t.true (P.byteEq (0) (248) (msg ([248])))
  t.true (P.byteEq (1) (64) (msg ([144, 64, 96])))
  t.true (P.byteEq (2) (96) (msg ([144, 64, 96])))
  t.true (P.byteEq (-1) (96) (msg ([144, 64, 96])))
})

test ('dataEqBy', (t) => {
  let p = (v) => v[0] >> 4 === 8

  t.false (P.dataEqBy (p) (null))
  t.false (P.dataEqBy (p) (undefined))
  t.false (P.dataEqBy (p) ([]))
  t.false (P.dataEqBy (p) ({}))
  t.true (P.dataEqBy (p) (msg ([128, 64, 96])))
})

test ('byteEqBy', (t) => {
  let p = (v) => v >> 4 === 8

  t.false (P.byteEqBy (0) (p) (null))
  t.false (P.byteEqBy (0) (p) (undefined))
  t.false (P.byteEqBy (0) (p) ([]))
  t.false (P.byteEqBy (0) (p) ({}))
  t.true (P.byteEqBy (0) (p) (msg ([128, 64, 96])))
  t.true (P.byteEqBy (1) (p) (msg ([144, 128, 96])))
  t.true (P.byteEqBy (2) (p) (msg ([144, 64, 128])))
  t.true (P.byteEqBy (-1) (p) (msg ([144, 64, 128])))
})

// ---------------- Channel Voice Messages ------------------------

test ('isChannelVoiceMessageOfType', (t) => {
  t.false (P.isChannelVoiceMessageOfType (null) (null))
  t.false (P.isChannelVoiceMessageOfType (null) (undefined))
  t.false (P.isChannelVoiceMessageOfType (undefined) (null))
  t.false (P.isChannelVoiceMessageOfType (undefined) (undefined))
  t.false (P.isChannelVoiceMessageOfType (8) (null))
  t.false (P.isChannelVoiceMessageOfType (8) (undefined))
  t.false (P.isChannelVoiceMessageOfType (8) (msg ([128])))
  t.false (P.isChannelVoiceMessageOfType (8) (msg ([128, 64])))
  t.true (P.isChannelVoiceMessageOfType (8) (msg ([128, 64, 96])))
  t.true (P.isChannelVoiceMessageOfType (12) (msg ([192, 13])))
  t.false (P.isChannelVoiceMessageOfType (12) (msg ([192, 13, 88])))
})

test ('isNoteOff', (t) => {
  t.true (P.isNoteOff (msg ([128, 64, 96])))
  t.false (P.isNoteOff (msg ([144, 64, 0])))
})

test ('isNoteOn', (t) => {
  t.true (P.isNoteOn (msg ([144, 64, 96])))
  t.false (P.isNoteOn (msg ([160, 64, 96])))
})

test ('asNoteOn', (t) => {
  t.true (P.asNoteOn (msg ([144, 64, 96])))
  t.false (P.asNoteOn (msg ([160, 64, 96])))
  t.false (P.asNoteOn (msg ([144, 64, 0])))
})

test ('asNoteOff', (t) => {
  t.true (P.asNoteOff (msg ([128, 64, 96])))
  t.true (P.asNoteOff (msg ([143, 64, 96])))
  t.false (P.asNoteOff (msg ([144, 64, 96])))
})

test ('isNote', (t) => {
  t.true (P.isNote (msg ([128, 64, 96])))
  t.false (P.isNote (msg ([160, 64, 96])))
})

test ('hasVelocity', (t) => {
  t.true (P.isNote (msg ([128, 64, 96])))
  t.false (P.isNote (msg ([160, 64, 96])))
})

test ('velocityEq', (t) => {
  t.false (P.velocityEq (127) (msg ([144, 64, 96])))
  t.true (P.velocityEq (127) (msg ([144, 64, 127])))
})

test ('isPolyPressure', (t) => {
  t.true (P.isPolyPressure (msg ([175, 64, 96])))
  t.false (P.isPolyPressure (msg ([176, 64, 96])))
})

test ('hasNote', (t) => {
  t.true (P.hasNote (msg ([128, 64, 96])))
  t.true (P.hasNote (msg ([144, 64, 96])))
  t.true (P.hasNote (msg ([159, 64, 96])))
  t.true (P.hasNote (msg ([175, 64, 96])))
  t.false (P.hasNote (msg ([176, 64, 96])))
})

test ('noteEq', (t) => {
  t.true (P.noteEq (64) (msg ([144, 64, 96])))
  t.true (P.noteEq (64) (msg ([160, 64, 96])))
})

test ('noteIn', (t) => {
	t.false (P.noteIn ([32, 33, 34]) (msg ([176, 32, 18])))
	t.false (P.noteIn ([32, 33, 34]) (msg ([144, 30, 18])))
	t.true (P.noteIn ([32, 33, 34]) (msg ([144, 32, 18])))
})

test ('isControlChange', (t) => {
  t.true (P.isControlChange (msg ([191, 32, 16])))
  t.false (P.isControlChange (msg ([192, 32, 16])))
})

test ('controlEq', (t) => {
  t.false (P.controlEq (32) (msg ([144, 32, 18])))
  t.true (P.controlEq (32) (msg ([176, 32, 18])))
})

test ('controlIn', (t) => {
	t.false (P.controlIn ([32, 33, 34]) (msg ([144, 32, 18])))
	t.false (P.controlIn ([32, 33, 34]) (msg ([176, 30, 18])))
	t.true (P.controlIn ([32, 33, 34]) (msg ([176, 32, 18])))
})

test ('valueEq', (t) => {
  t.false (P.valueEq (18) (msg ([144, 32, 18])))
  t.true (P.valueEq (18) (msg ([176, 32, 18])))
})

test ('isTimbreChange', (t) => {
  t.false (P.isTimbreChange (msg ([176, 50, 18])))
  t.true (P.isTimbreChange (msg ([176, 74, 18])))
})

test ('isProgramChange', (t) => {
  t.true (P.isProgramChange (msg ([192, 48])))
  t.false (P.isProgramChange (msg ([208, 48])))
})

test ('programEq', (t) => {
  t.false (P.programEq (18) (msg ([144, 18])))
  t.true (P.programEq (18) (msg ([192, 18])))
})

test ('isChannelPressure', (t) => {
  t.true (P.isChannelPressure (msg ([208, 96])))
  t.false (P.isChannelPressure (msg ([224, 96])))
})

test ('hasPressure', (t) => {
  t.false (P.hasPressure (msg ([128, 64, 96])))
  t.true (P.hasPressure (msg ([208, 96])))
})

test ('pressureEq', (t) => {
  t.true (P.pressureEq (96) (msg ([160, 64, 96])))
})

test ('isPitchBend', (t) => {
  t.true (P.isPitchBend (msg ([224, 64, 0])))
  t.false (P.isPitchBend (msg ([240, 64, 0])))
})

test ('pitchBendEq', (t) => {
  t.false (P.pitchBendEq (8192) (msg ([144, 0, 64])))
  t.true (P.pitchBendEq (8192) (msg ([224, 0, 64])))
})

// ------------------- Channel Mode Messages ----------------------

test ('isChannelModeMessage', (t) => {
  t.false (P.isChannelModeMessage (null) (msg ([176, 120, 0])))
  t.false (P.isChannelModeMessage (undefined) (msg ([176, 120, 0])))
  t.false (P.isChannelModeMessage (null) ([176, 120, 0]))
  t.false (P.isChannelModeMessage (undefined) ([176, 120, 0]))
  t.false (P.isChannelModeMessage (120) (msg ([175, 120, 0])))
  t.false (P.isChannelModeMessage (120) ([175, 120, 0]))
  t.false (P.isChannelModeMessage (120, 0) (msg ([176, 119, 0])))
  t.false (P.isChannelModeMessage (120, 0) ([176, 119, 0]))
  t.true (P.isChannelModeMessage (120, 0) (msg ([176, 120, 0])))
  t.false (P.isChannelModeMessage (120, 0) (msg ([176, 120, 1])))
})

test ('channel mode message predicates', (t) => {
  t.true (P.isAllSoundOff (msg ([176, 120, 0])))
  t.true (P.isResetAll (msg ([176, 121, 54])))
  t.true (P.isLocalControlOff (msg ([176, 122, 0])))
  t.true (P.isLocalControlOn (msg ([176, 122, 127])))
  t.true (P.isAllNotesOff (msg ([176, 123, 0])))
  t.true (P.isOmniModeOff (msg ([176, 124, 0])))
  t.true (P.isOmniModeOn (msg ([176, 125, 0])))
  t.true (P.isMonoModeOn (msg ([176, 126, 54])))
  t.true (P.isPolyModeOn (msg ([176, 127, 0])))
})

// --------------------- Channel Messages --------------------------

test ('isChannelMode', (t) => {
  t.false (P.isChannelMode (msg ([176, 119, 0])))
  t.true (P.isChannelMode (msg ([176, 120, 0])))
})

test ('isChannelVoice', (t) => {
  t.true (P.isChannelVoice (msg ([129, 64, 96])))
  t.false (P.isChannelVoice (msg ([176, 120, 0])))
})

test ('isChannelMessage', (t) => {
  t.true (P.isChannelMessage (msg ([144, 64, 96])))
  t.false (P.isChannelMessage (msg ([248])))
})

test ('isOnChannel', (t) => {
  t.false (P.isOnChannel (2) (msg ([128, 64, 96])))
  t.true (P.isOnChannel (2) (msg ([130, 64, 96])))
})

test ('isOnChannels', (t) => {
  t.false (P.isOnChannels ([2, 5]) (msg ([128, 64, 96])))
  t.true (P.isOnChannels ([2, 5]) (msg ([130, 64, 96])))
  t.true (P.isOnChannels ([2, 5]) (msg ([133, 64, 96])))
})

// ----------------- System Common Messages ------------------------

test ('isSystemExclusive', (t) => {
  t.true (P.isSystemExclusive (msg ([240, 65, 16, 66, 18, 64, 0, 127, 0, 65, 247])))
})

test ('isMIDITimeCodeQuarterFrame', (t) => {
  t.true (P.isMIDITimeCodeQuarterFrame (msg ([241, 50])))
})

test ('isSongPositionPointer', (t) => {
  t.true (P.isSongPositionPointer (msg ([242, 0, 8])))
})

test ('isSongSelect', (t) => {
  t.true (P.isSongSelect (msg ([243, 15])))
})

test ('isTuneRequest', (t) => {
  t.true (P.isTuneRequest (msg ([246])))
})

test ('isEndOfExclusive', (t) => {
  t.true (P.isEndOfExclusive (msg ([247])))
})

// -------------------- System Real Time Messages ------------------------

test ('system real time midi messages predicates', (t) => {
  t.true (P.isMIDIClock (msg ([248])))
  t.true (P.isStart (msg ([250])))
  t.true (P.isContinue (msg ([251])))
  t.true (P.isStop (msg ([252])))
  t.true (P.isActiveSensing (msg ([254])))
  t.true (P.isReset (msg ([255])))
})

// --------------------------- RPN / NRPN --------------------------------

test ('isRPN', (t) => {
  t.true (P.isRPN (msg ([176, 101, 25, 176, 100, 0, 176, 6, 33, 176, 38, 0, 176, 101, 127, 176, 100, 127]))) 
})

test ('isNRPN', (t) => {
  t.true (P.isNRPN (msg ([176, 99, 25, 176, 98, 0, 176, 6, 33, 176, 38, 0, 176, 101, 127, 176, 100, 127]))) 
})

// ---------------------- MIDI File Meta Events --------------------------

test ('isTempoChange', (t) => {
  t.true (M.isTempoChange (meta (81)))
})

// ------------------------ frMIDI Meta Events ---------------------------

test ('isTimingEvent', (t) => {
  t.true (F.isTimingEvent (timingEvent (100, 150)))
})

test ('isTimeDivisionEvent', (t) => {
  t.true (F.isTimeDivisionEvent (timeDivisionEvent (48)))
})

test ('isSequenceEvent', (t) => {
  t.true (F.isSequenceEvent (sequenceEvent ({ timeDivision: 240 })))
})

test ('isPatternItemEvent', (t) => {
  t.true (F.isPatternItemEvent (patternItemEvent (0)))
})
