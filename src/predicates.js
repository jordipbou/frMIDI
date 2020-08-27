import { 
  all, allPass, anyPass, both, cond, complement, curry, 
  either, equals, F, has, includes, is, isEmpty, 
  length,path, pathEq, propEq, propSatisfies, T
} from 'ramda'

// ================= MIDI Messages predicates ======================

export let seemsMIDIMessageAsArray =
  allPass ([either (is (Array)) (is (Uint8Array)),
            complement (isEmpty),
            all (is (Number))])

export let seemsMIDIMessageAsObject =
  allPass ([is (Object),
            propEq ('type', 'midimessage'),
            propSatisfies (seemsMIDIMessageAsArray, 'data')])

export let seemsMIDIMessage = 
  either (seemsMIDIMessageAsArray) (seemsMIDIMessageAsObject)

export let seemsArrayOfMIDIMessagesAsArrays =
  both (is (Array))
       (all (seemsMIDIMessageAsArray))

export let seemsArrayOfMIDIMessagesAsObjects = 
  both (is (Array))
       (all (seemsMIDIMessageAsObject))

export let dataEq = curry ((d, m) =>
  seemsMIDIMessageAsArray (m) ?
    equals (d) (m)
    : seemsMIDIMessage (m) ?
      dataEq (d) (m.data)
      : false )

export let byteEq = curry ((n, d, m) =>
  seemsMIDIMessageAsArray (m) ?
    pathEq ([n]) (d) (m)
    : seemsMIDIMessage (m) ?
      byteEq (n) (d) (m.data)
      : false )

export let dataEqBy = curry ((p, m) =>
  seemsMIDIMessageAsArray (m) ?
    p (m)
    : seemsMIDIMessage (m) ?
      dataEqBy (p) (m.data)
      : false )

export let byteEqBy = curry ((n, p, m) =>
  seemsMIDIMessageAsArray (m) ?
    p (path ([n]) (m))
    : seemsMIDIMessage (m) ?
      byteEqBy (n) (p) (m.data)
      : false )


// ------------------ Channel Voice Messages -----------------------

export let isChannelVoiceMessageOfType = (t) =>
  both (seemsMIDIMessage)
       (dataEqBy 
         (p => includes (t, [8, 9, 10, 11, 14]) ?
                 length(p) === 3 && p[0] >> 4 === t
                 : length(p) === 2 && p[0] >> 4 === t))

export let isNoteOff = 
  isChannelVoiceMessageOfType (8)

export let isNoteOn = 
  isChannelVoiceMessageOfType (9)

export let asNoteOn = 
  both (isNoteOn) (complement (byteEq (2) (0)))

export let asNoteOff =
  either (isNoteOff) (both (isNoteOn) (byteEq (2) (0)))

export let isNote = 
  either (isNoteOff) (isNoteOn)

export let hasVelocity = 
  isNote

export let velocityEq = (v) =>
  both (hasVelocity)
       (byteEq (2) (v))

export let isPolyPressure = 
  isChannelVoiceMessageOfType (10)

export let hasNote = 
  either (isNote) (isPolyPressure)

export let noteEq = (n) => 
  both (hasNote)
       (byteEq (1) (n))

export let isControlChange = 
  isChannelVoiceMessageOfType (11)

export let controlEq = (c) =>
  both (isControlChange)
       (byteEq (1) (c))

export let valueEq = (v) =>
  both (isControlChange)
       (byteEq (2) (v))

export let isProgramChange = 
  isChannelVoiceMessageOfType (12)

export let programEq = (p) =>
  both (isProgramChange)
       (byteEq (1) (p))

export let isChannelPressure = 
  isChannelVoiceMessageOfType (13)

export let hasPressure =
  either (isPolyPressure) (isChannelPressure)

export let pressureEq = (p) =>
  cond ([
    [isPolyPressure, byteEq (2) (p)],
    [isChannelPressure, byteEq (1) (p)],
    [T, F]])

export let isPitchBend = 
  isChannelVoiceMessageOfType (14)

export let pitchBendEq = (pb) =>
  allPass ([isPitchBend,
            byteEq (1) (pb & 0x7F),
            byteEq (2) (pb >> 7)])


// ------------ Channel Mode Messages ----------------

export let isChannelModeMessage = (d1, d2) =>
  d2 === undefined ?
    both (isControlChange) (byteEq (1) (d1))
    : allPass ([isControlChange,
                byteEq (1) (d1),
                byteEq (2) (d2)])

export let isAllSoundOff = 
  isChannelModeMessage (120, 0)

export let isResetAll = 
  isChannelModeMessage (121)

export let isLocalControlOff = 
  isChannelModeMessage (122, 0)

export let isLocalControlOn = 
  isChannelModeMessage (122, 127)

export let isAllNotesOff = 
  isChannelModeMessage (123, 0)

export let isOmniModeOff =  
  isChannelModeMessage (124, 0)

export let isOmniModeOn = 
  isChannelModeMessage (125, 0)

export let isMonoModeOn = 
  isChannelModeMessage (126)

export let isPolyModeOn = 
  isChannelModeMessage (127, 0)

export let isChannelMode =
  anyPass ([isAllSoundOff,
            isResetAll,
            isLocalControlOff,
            isLocalControlOn,
            isAllNotesOff,
            isOmniModeOff,
            isOmniModeOn,
            isMonoModeOn,
            isPolyModeOn])

export let isChannelVoice =
  anyPass ([isNote,
            isPolyPressure,
            both (isControlChange) 
                 (complement (isChannelMode)),
            isProgramChange,
            isChannelPressure,
            isPitchBend])

// -------------------- RPN & NRPN predicates ----------------------

export let isRPN =
  allPass ([seemsMIDIMessage,
            byteEq (1) (101),
            byteEq (4) (100),
            byteEq (7) (6),
            byteEq (-5) (101),
            byteEq (-4) (127),
            byteEq (-2) (100),
            byteEq (-1) (127)])

export let isNRPN =
  allPass ([seemsMIDIMessage,
            byteEq (1) (99),
            byteEq (4) (98),
            byteEq (7) (6),
            byteEq (-5) (101),
            byteEq (-4) (127),
            byteEq (-2) (100),
            byteEq (-1) (127)])

export let isChannelMessage =
  anyPass ([ isChannelMode, isChannelVoice, isRPN, isNRPN ])

export let isOnChannel = (ch) =>
  both (isChannelMessage)
       (byteEqBy (0) (v => (v & 0xF) === ch))

export let isOnChannels = (chs) =>
  both (isChannelMessage)
       (byteEqBy (0) (v => includes (v & 0xF, chs)))

// =============== System Common message predicates ================

export let isSystemExclusive = 
  allPass ([seemsMIDIMessage,
            byteEq (0) (240),
            byteEq (-1) (247)])

export let isMIDITimeCodeQuarterFrame =
  both (seemsMIDIMessage) (byteEq (0) (241))

export let isSongPositionPointer =
  both (seemsMIDIMessage) (byteEq (0) (242))

export let isSongSelect =
  both (seemsMIDIMessage) (byteEq (0) (243))

export let isTuneRequest =
  both (seemsMIDIMessage) (dataEq ([246]))

export let isEndOfExclusive =
  both (seemsMIDIMessage) (dataEq ([247]))

// ============= System Real Time message predicates ===============

export let isMIDIClock =
  both (seemsMIDIMessage) (dataEq ([248]))

export let isStart =
  both (seemsMIDIMessage) (dataEq ([250]))

export let isContinue =
  both (seemsMIDIMessage) (dataEq ([251]))

export let isStop =
  both (seemsMIDIMessage) (dataEq ([252]))

export let isActiveSensing =
  both (seemsMIDIMessage) (dataEq ([254]))

// Reset and MIDI File Meta Events have the same value on
// their first byte: 0xFF.
// Reset message is just one byte long and MIDI File Meta
// Events are several bytes long. It's not possible to
// differentiate them based on first byte, it's the
// programmer responsability to only use isReset outside
// MIDI Files and seemsMIDIMetaEvent inside MIDI Files.
export let isReset =
  both (either (seemsMIDIMessage) (seemsMIDIMessageAsArray))
       (dataEq ([255]))


// ============== MIDI File Meta Events predicates =================

// TODO: Check that length is correct !!!
export let seemsMIDIMetaEventArray =
  allPass ([is (Array),
            complement (isEmpty),
            all (is (Number)),
            pathEq ([0]) (255)])

export let seemsMIDIMetaEventObject =
  allPass ([is (Object),
            propEq ('type', 'metaevent'),
            has ('metaType'),
            has ('data')])

export let seemsMIDIMetaEvent =
  either (seemsMIDIMetaEventArray) (seemsMIDIMetaEventObject)

export let metaTypeEq = curry((t, m) => 
  seemsMIDIMetaEventArray (m) ?
    pathEq ([1]) (t) (m)
    : seemsMIDIMetaEventObject (m) ?
      metaTypeEq (t, m.data) 
      : false)

export let isTempoChange = 
  both (seemsMIDIMetaEvent) (metaTypeEq (81))
