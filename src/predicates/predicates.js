import { 
    __, all, allPass, any, anyPass, both, cond, complement,
    either, equals, F, has, includes, is, isEmpty, 
    length,path, pathEq, propEq, propSatisfies, reduce, T, zip
  } from 'ramda'

// ===================== MIDI Messages predicates ========================

export const seemsMessage = (msg) => 
  msg !== null
  && msg !== undefined
  && typeof msg === 'object'
  && msg.type === 'midimessage'
  && msg.data !== null
  && msg.data !== undefined
  && (msg.data.constructor === Uint8Array 
   || msg.data.constructor === Array)
  && msg.data.length > 0

// ------- Utilities for comparing MIDI messages byte array values -------

export const dataEq = 
  (data) => (msg) => 
    msg === null || msg === undefined || msg.data === undefined ?
      false
      : reduce ((acc, [a, b]) => acc && a === b) 
      	       (true) 
      		     (zip (data) (msg.data))

export const byteEq = 
  (n) => (data) => (msg) =>
    msg === null || msg === undefined || msg.data === undefined ?
      false
      : pathEq ([n]) (data) (msg.data)

export const dataEqBy = 
  (pred) => (msg) =>
    msg === null || msg === undefined || msg.data === undefined ?
      false
      : pred (msg.data)

export const byteEqBy = 
  (n) => (pred) => (msg) =>
    msg === null || msg === undefined || msg.data === undefined ?
      false
      : pred (path ([n]) (msg.data))


// --------------------- Channel Voice Messages --------------------------

export const isChannelVoiceMessageOfType = 
  (type) => (msg) =>
    dataEqBy 
      (p => includes (type, [8, 9, 10, 11, 14]) ?
              length (p) === 3 && p [0] >> 4 === type
              : length (p) === 2 && p [0] >> 4 === type) (msg)

export const isNoteOff = (msg) =>
  isChannelVoiceMessageOfType (8) (msg)

export const isNoteOn = (msg) =>
  isChannelVoiceMessageOfType (9) (msg)

export const asNoteOn = (msg) =>
  both (isNoteOn) (complement (byteEq (2) (0))) (msg)

export const asNoteOff = (msg) =>
  either (isNoteOff) (both (isNoteOn) (byteEq (2) (0))) (msg)

export const isNote = (msg) =>
  either (isNoteOff) (isNoteOn) (msg)

export const hasVelocity = (msg) =>
  isNote (msg)

export const velocityEq = (v) => (msg) =>
  both (hasVelocity)
       (byteEq (2) (v))
       (msg)

export const isPolyPressure = (msg) =>
  isChannelVoiceMessageOfType (10) (msg)

export const hasNote = (msg) =>
  either (isNote) (isPolyPressure) (msg)

export const noteEq = (n) => (msg) =>
  both (hasNote)
       (byteEq (1) (n))
       (msg)

export const noteIn = (notes) => (msg) =>
	both (isNote)
			 ((_) => any ((n) => byteEq (1) (n) (msg)) (notes))
			 (msg)

export const isControlChange = (msg) =>
  isChannelVoiceMessageOfType (11) (msg)

export const controlEq = (c) => (msg) =>
  both (isControlChange)
       (byteEq (1) (c))
       (msg)

export const controlIn = (controls) => (msg) =>
	both (isControlChange)
			 ((_) => any ((c) => byteEq (1) (c) (msg)) (controls))
			 (msg)

export const valueEq = (v) => (msg) =>
  both (isControlChange)
       (byteEq (2) (v))
       (msg)

export const valueIn = (values) => (msg) =>
	both (isControlChange)
			 ((_) => any ((c) => byteEq (2) (c) (msg)) (values))
			 (msg)

// Some CC messages by name
export const isTimbreChange = (msg) =>
  both (isControlChange)
       (controlEq (74))
       (msg)

export const isProgramChange = (msg) =>
  isChannelVoiceMessageOfType (12) (msg)

export const programEq = (p) => (msg) =>
  both (isProgramChange)
       (byteEq (1) (p))
       (msg)

export const isChannelPressure = (msg) =>
  isChannelVoiceMessageOfType (13) (msg)

export const hasPressure = (msg) =>
  either (isPolyPressure) (isChannelPressure) (msg)

export const pressureEq = (p) => (msg) =>
  cond ([[isPolyPressure, byteEq (2) (p)],
         [isChannelPressure, byteEq (1) (p)],
         [T, F]])
       (msg)

export const isPitchBend = (msg) =>
  isChannelVoiceMessageOfType (14) (msg)

export const pitchBendEq = (pb) => (msg) =>
  allPass ([isPitchBend,
            byteEq (1) (pb & 0x7F),
            byteEq (2) (pb >> 7)])
          (msg)


// --------------------- Channel Mode Messages ---------------------------

export const isChannelModeMessage = (d1, d2) => (msg) => 
  d2 === undefined ?
    both (isControlChange) (byteEq (1) (d1)) (msg)
    : allPass ([isControlChange,
                byteEq (1) (d1),
                byteEq (2) (d2)])
              (msg)

export const isAllSoundOff = (msg) =>
  isChannelModeMessage (120, 0) (msg)

export const isResetAll = (msg) =>
  isChannelModeMessage (121) (msg)

export const isLocalControlOff = (msg) =>
  isChannelModeMessage (122, 0) (msg)

export const isLocalControlOn = (msg) =>
  isChannelModeMessage (122, 127) (msg)

export const isAllNotesOff = (msg) =>
  isChannelModeMessage (123, 0) (msg)

export const isOmniModeOff = (msg) =>
  isChannelModeMessage (124, 0) (msg)

export const isOmniModeOn = (msg) =>
  isChannelModeMessage (125, 0) (msg)

export const isMonoModeOn = (msg) =>
  isChannelModeMessage (126) (msg)

export const isPolyModeOn = (msg) =>
  isChannelModeMessage (127, 0) (msg)

export const isChannelMode = (msg) =>
  anyPass ([isAllSoundOff,
            isResetAll,
            isLocalControlOff,
            isLocalControlOn,
            isAllNotesOff,
            isOmniModeOff,
            isOmniModeOn,
            isMonoModeOn,
            isPolyModeOn])
          (msg)

export const isChannelVoice = (msg) =>
  anyPass ([isNote,
            isPolyPressure,
            both (isControlChange) 
                 (complement (isChannelMode)),
            isProgramChange,
            isChannelPressure,
            isPitchBend])
          (msg)

// ----------------------- RPN & NRPN predicates -------------------------

export const isRPN = (msg) =>
  allPass ([//seemsMessage,
            byteEq (1) (101),
            byteEq (4) (100),
            byteEq (7) (6),
            byteEq (-5) (101),
            byteEq (-4) (127),
            byteEq (-2) (100),
            byteEq (-1) (127)])
          (msg)

export const isNRPN = (msg) =>
  allPass ([//seemsMessage,
            byteEq (1) (99),
            byteEq (4) (98),
            byteEq (7) (6),
            byteEq (-5) (101),
            byteEq (-4) (127),
            byteEq (-2) (100),
            byteEq (-1) (127)])
          (msg)

export const isChannelMessage = (msg) =>
  anyPass ([ isChannelMode, isChannelVoice, isRPN, isNRPN ])
          (msg)

export const channelEq = (ch) => (msg) =>
  both (isChannelMessage)
       (byteEqBy (0) (v => (v & 0xF) === ch))
       (msg)

export const channelIn = (chs) => (msg) =>
  both (isChannelMessage)
       (byteEqBy (0) (v => includes (v & 0xF, chs)))
       (msg)

// ------------------ System Common message predicates -------------------

export const isSystemExclusive = (msg) =>
  both (byteEq (0) (240)) (byteEq (-1) (247)) (msg)

export const isMIDITimeCodeQuarterFrame = (msg) =>
  byteEq (0) (241) (msg)

export const isSongPositionPointer = (msg) =>
  byteEq (0) (242) (msg)

export const isSongSelect = (msg) =>
  byteEq (0) (243) (msg)

export const isTuneRequest = (msg) =>
  dataEq ([246]) (msg)

export const isEndOfExclusive = (msg) =>
  dataEq ([247]) (msg)

// ----------------- System Real Time message predicates -----------------

export const isMIDIClock = (msg) =>
  dataEq ([248]) (msg)

export const isStart = (msg) =>
  dataEq ([250]) (msg)

export const isContinue = (msg) =>
  dataEq ([251]) (msg)

export const isStop = (msg) =>
  dataEq ([252]) (msg)

export const isActiveSensing = (msg) =>
  dataEq ([254]) (msg)

// Reset and MIDI File Meta Events have the same value on
// their first byte: 0xFF.
// Reset message is just one byte long and MIDI File Meta
// Events are several bytes long. It's not possible to
// differentiate them based on first byte, it's the
// programmer responsability to only use isReset outside
// MIDI Files and seemsMetaEvent inside MIDI Files.
export const isReset = (msg) =>
  dataEq ([255]) (msg)
