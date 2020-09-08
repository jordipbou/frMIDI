import { 
  all, allPass, anyPass, both, cond, complement, curry, 
  either, equals, F, has, includes, is, isEmpty, 
  length,path, pathEq, propEq, propSatisfies, T
} from 'ramda'

// ================= MIDI Messages predicates ======================

export const seemsMIDIMessageAsArray = (msg) => 
  allPass ([either (is (Array)) (is (Uint8Array)),
            complement (isEmpty),
            all (is (Number))]) (msg)

export const seemsMIDIMessageAsObject = (msg) =>
  allPass ([is (Object),
            propEq ('type', 'midimessage'),
            propSatisfies (seemsMIDIMessageAsArray, 'data')]) (msg)

export const seemsMIDIMessage = (msg) =>
  either (seemsMIDIMessageAsArray) (seemsMIDIMessageAsObject) (msg)

export const seemsArrayOfMIDIMessagesAsArrays = (msg) =>
  both (is (Array))
       (all (seemsMIDIMessageAsArray))
       (msg)

export const seemsArrayOfMIDIMessagesAsObjects = 
  both (is (Array))
       (all (seemsMIDIMessageAsObject))

export const dataEq = curry ((data, msg) =>
  seemsMIDIMessageAsArray (msg) ?
    equals (data) (msg)
    : seemsMIDIMessage (msg) ?
      dataEq (data) (msg.data)
      : false )

export const byteEq = curry ((n, data, msg) =>
  seemsMIDIMessageAsArray (msg) ?
    pathEq ([n]) (data) (msg)
    : seemsMIDIMessage (msg) ?
      byteEq (n) (data) (msg.data)
      : false )

export const dataEqBy = curry ((pred, msg) =>
  seemsMIDIMessageAsArray (msg) ?
    pred (msg)
    : seemsMIDIMessage (msg) ?
      dataEqBy (pred) (msg.data)
      : false )

export const byteEqBy = curry ((n, pred, msg) =>
  seemsMIDIMessageAsArray (msg) ?
    pred (path ([n]) (msg))
    : seemsMIDIMessage (msg) ?
      byteEqBy (n) (pred) (msg.data)
      : false )


// ------------------ Channel Voice Messages -----------------------

export const isChannelVoiceMessageOfType = (type) => (msg) =>
  both (seemsMIDIMessage)
       (dataEqBy 
         (p => includes (type, [8, 9, 10, 11, 14]) ?
                 length (p) === 3 && p [0] >> 4 === type
                 : length (p) === 2 && p [0] >> 4 === type)) (msg)

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

export const isControlChange = (msg) =>
  isChannelVoiceMessageOfType (11) (msg)

export const controlEq = (c) => (msg) =>
  both (isControlChange)
       (byteEq (1) (c))
       (msg)

export const valueEq = (v) => (msg) =>
  both (isControlChange)
       (byteEq (2) (v))
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


// ------------ Channel Mode Messages ----------------

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

// -------------------- RPN & NRPN predicates ----------------------

export const isRPN = (msg) =>
  allPass ([seemsMIDIMessage,
            byteEq (1) (101),
            byteEq (4) (100),
            byteEq (7) (6),
            byteEq (-5) (101),
            byteEq (-4) (127),
            byteEq (-2) (100),
            byteEq (-1) (127)])
          (msg)

export const isNRPN = (msg) =>
  allPass ([seemsMIDIMessage,
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

export const isOnChannel = (ch) => (msg) =>
  both (isChannelMessage)
       (byteEqBy (0) (v => (v & 0xF) === ch))
       (msg)

export const isOnChannels = (chs) => (msg) =>
  both (isChannelMessage)
       (byteEqBy (0) (v => includes (v & 0xF, chs)))
       (msg)

// =============== System Common message predicates ================

export const isSystemExclusive = (msg) =>
  allPass ([seemsMIDIMessage,
            byteEq (0) (240),
            byteEq (-1) (247)])
          (msg)

export const isMIDITimeCodeQuarterFrame = (msg) =>
  both (seemsMIDIMessage) (byteEq (0) (241)) (msg)

export const isSongPositionPointer = (msg) =>
  both (seemsMIDIMessage) (byteEq (0) (242)) (msg)

export const isSongSelect = (msg) =>
  both (seemsMIDIMessage) (byteEq (0) (243)) (msg)

export const isTuneRequest = (msg) =>
  both (seemsMIDIMessage) (dataEq ([246])) (msg)

export const isEndOfExclusive = (msg) =>
  both (seemsMIDIMessage) (dataEq ([247])) (msg)

// ============= System Real Time message predicates ===============

export const isMIDIClock = (msg) =>
  both (seemsMIDIMessage) (dataEq ([248])) (msg)

export const isStart = (msg) =>
  both (seemsMIDIMessage) (dataEq ([250])) (msg)

export const isContinue = (msg) =>
  both (seemsMIDIMessage) (dataEq ([251])) (msg)

export const isStop = (msg) =>
  both (seemsMIDIMessage) (dataEq ([252])) (msg)

export const isActiveSensing = (msg) =>
  both (seemsMIDIMessage) (dataEq ([254])) (msg)

// Reset and MIDI File Meta Events have the same value on
// their first byte: 0xFF.
// Reset message is just one byte long and MIDI File Meta
// Events are several bytes long. It's not possible to
// differentiate them based on first byte, it's the
// programmer responsability to only use isReset outside
// MIDI Files and seemsMIDIMetaEvent inside MIDI Files.
export const isReset = (msg) =>
  both (either (seemsMIDIMessage) (seemsMIDIMessageAsArray))
       (dataEq ([255]))
       (msg)


// ============== MIDI File Meta Events predicates =================

// TODO: Check that length is correct !!!
export const seemsMIDIMetaEventArray = (msg) =>
  allPass ([is (Array),
            complement (isEmpty),
            all (is (Number)),
            pathEq ([0]) (255)])
          (msg)

export const seemsMIDIMetaEventObject = (msg) =>
  allPass ([is (Object),
            propEq ('type', 'metaevent'),
            has ('metaType'),
            has ('data')])
          (msg)

export const seemsMIDIMetaEvent = (msg) =>
  either (seemsMIDIMetaEventArray) (seemsMIDIMetaEventObject) (msg)

export const metaTypeEq = curry((type, msg) => 
  seemsMIDIMetaEventArray (msg) ?
    pathEq ([1]) (type) (msg)
    : seemsMIDIMetaEventObject (msg) ?
      metaTypeEq (type, msg.data) 
      : false)

export const isTempoChange = (msg) =>
  both (seemsMIDIMetaEvent) (metaTypeEq (81)) (msg)
