export {
    // ----------------------- Generic functions to validate MIDI messages
    seemsMessageAsArray,
    seemsMessage,
    // ----------- Utilities for comparing MIDI messages byte array values
    dataEq,
    byteEq,
    dataEqBy,
    byteEqBy,
    // --------------------------------------Channel (Voice|Mode) Messages
    isChannelMessage,
    isOnChannel,
    isOnChannels,
    // -------------------------------------------- Channel Voice Messages
    isChannelVoice,
    isNoteOff,
    isNoteOn,
    asNoteOn,
    asNoteOff,
    isNote,
    hasVelocity,
    velocityEq,
    isPolyPressure,
    hasNote,
    noteEq,
    isControlChange,
    controlEq,
    valueEq,
    // Some CC messages by name ---
    isTimbreChange,
    // ----------------------------
    // RPN & NRPN predicates-------
    isRPN,
    isNRPN,
    // ----------------------------
    isProgramChange,
    programEq,
    isChannelPressure,
    hasPressure,
    pressureEq,
    isPitchBend,
    pitchBendEq,
    // --------------------------------------------- Channel Mode Messages
    isChannelMode,
    isAllSoundOff,
    isResetAll,
    isLocalControlOff,
    isLocalControlOn,
    isAllNotesOff,
    isOmniModeOff,
    isOmniModeOn,
    isMonoModeOn,
    isPolyModeOn,
    // ---------------------------------- System Common message predicates
    isSystemExclusive,
    isMIDITimeCodeQuarterFrame,
    isSongPositionPointer,
    isSongSelect,
    isTuneRequest,
    isEndOfExclusive,
    // ------------------------------- System Real Time message predicates
    isMIDIClock,
    isStart,
    isContinue,
    isStop,
    isActiveSensing,
    isReset,
    // ---------------------------------- MIDI File Meta Events predicates
    seemsMetaEvent, // TODO: Change name to seemsMetaEvent
    metaTypeEq,
    isTempoChange,
    isTimingEvent
  } from './predicates.js'
