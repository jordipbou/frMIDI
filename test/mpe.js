const test = require ('ava')
import { cc, cp, on, off, pb } from '../src/messages.js'
import { 
  addNotes,
  byNotesAndWeight,
  isActiveNote, isLowerZone, isOnMasterChannel, isOnZone, isUpperZone,
  channelByKeyRange,
  leastNotesChannel,
  mpeNote, mpeZone, 
  notesPerChannel,
  processChannelPressureMessage,
  processNoteOnMessage, processNoteOffMessage,
  processPitchBendMessage,
  processTimbreMessage,
  seemsActiveNote
  } from '../src/mpe.js'
import { sort, map } from 'ramda'

test ('mpeNote', (t) => {
  let n = mpeNote (on (64))
  t.deepEqual (n, { note: 64,
                    channel: 0,
                    velocity: 96,
                    pitchBend: 0.0,
                    timbre: 0.0,
                    pressure: 96 })
})

test ('mpeZone', (t) => {
  let z = mpeZone (0, 4)
  t.deepEqual (z, { masterChannel: 0,
                    memberChannels: 4,
                    zoneSize: 5,
                    channels: [1, 2, 3, 4],
                    activeNotes: [] })

  z = mpeZone (15, 8)
  t.deepEqual (z, { masterChannel: 15,
                    memberChannels: 8,
                    zoneSize: 9,
                    channels: [7, 8, 9, 10, 11, 12, 13, 14],
                    activeNotes: [] })

  z = mpeZone (3, 4)
  t.deepEqual (z, undefined)

  z = mpeZone (0, 17)
  t.deepEqual (z, undefined)

  z = mpeZone (15, undefined)
  t.deepEqual (z, undefined)
})

test ('Is lower/upper zone', (t) => {
  let z = mpeZone (0, 5)
  t.true (isLowerZone (z))
  t.false (isUpperZone (z))

  z = mpeZone (15, 10)
  t.true (isUpperZone (z))
  t.false (isLowerZone (z))
})

test ('Is on zone', (t) => {
  t.false (isOnZone (mpeZone (0, 5)) (on (64)))
  t.true (isOnZone (mpeZone (0, 5)) (on (64, 96, 3)))
  t.false (isOnZone (mpeZone (0, 5)) (on (64, 96, 12)))

  t.false (isOnZone (mpeZone (15, 3)) (on (64, 96, 15)))
  t.true (isOnZone (mpeZone (15, 3)) (on (64, 96, 12)))
  t.false (isOnZone (mpeZone (15, 3)) (on (64, 96, 3)))
})

test ('Is on master channel', (t) => {
  t.true (isOnMasterChannel (mpeZone (0, 2)) (on (64)))
  t.true (isOnMasterChannel (mpeZone (15, 15)) (on (64, 96, 15)))
  t.false (isOnMasterChannel (mpeZone (0, 5)) (on (64, 96, 2)))
})

test ('Is active note', (t) => {
  let z = mpeZone (0, 2)

  t.false (isActiveNote (z) (on (64)))

  z.activeNotes = [mpeNote (on (64, 96, 1))]
  t.true (isActiveNote (z) (on (64, 100, 1)))
  t.false (isActiveNote (z) (on (32, 96, 1)))
})

test ('Seems active note', (t) => {
  let z = mpeZone (0, 2)

  t.false (seemsActiveNote (z) (on (64)))

  z.activeNotes = [mpeNote (on (64, 96, 1))]
  t.true (seemsActiveNote (z) (on (64, 12, 1)))
  t.true (seemsActiveNote (z) (off (64, 100, 0)))
  t.true (seemsActiveNote (z) (on (64, 75, 10)))
  t.false (seemsActiveNote (z) (on (32, 96, 1)))
})

test ('Process note on message', (t) => {
  let z = mpeZone (0, 2)

  let z2 = processNoteOnMessage (z) (on (64, 96, 1))
  t.true (isActiveNote (z2) (on (64, 12, 1)))
  t.deepEqual (mpeNote (on (64, 96, 1)), z2.activeNotes [0])

  let z3 = processNoteOnMessage (z2) (on (32, 96, 2))
  t.true (isActiveNote (z3) (on (64, 54, 1)))
  t.true (isActiveNote (z3) (on (32, 15, 2)))
  
  let z4 = processNoteOnMessage (z3) (on (64, 110, 1))
  t.deepEqual (mpeNote (on (64, 110, 1)), z4.activeNotes [0])
})

test ('Process note off message', (t) => {
  let z = mpeZone (0, 2)
  let z2 = processNoteOnMessage (z) (on (64, 95, 1))
  let z3 = processNoteOnMessage (z2) (on (78, 96, 2))
  let z4 = processNoteOffMessage (z3) (off (64, 12, 2))
  t.true (z4.activeNotes.length === 2)
  let z5 = processNoteOffMessage (z4) (off (64, 12, 1))
  t.true (z5.activeNotes.length === 1)
  t.deepEqual (mpeNote (on (78, 96, 2)), z5.activeNotes [0])
  let z6 = processNoteOffMessage (z5) (off (78, 100, 2))
  t.true (z6.activeNotes.length === 0)
})

test ('Process channel pressure message', (t) => {
  let z = mpeZone (0, 2)
  let z2 = processNoteOnMessage (z) (on (64, 95, 1))
  let z3 = processChannelPressureMessage (z2) (cp (112, 1))
  t.true (z3.activeNotes.length === 1)
  t.deepEqual (z3.activeNotes [0], { note: 64,
                                     channel: 1,
                                     velocity: 95,
                                     pitchBend: 0,
                                     timbre: 0,
                                     pressure: 112 })

  let z4 = processChannelPressureMessage (z3) (cp (100, 2))
  t.true (z3.activeNotes.length === 1)
  t.deepEqual (z3.activeNotes [0], { note: 64,
                                     channel: 1,
                                     velocity: 95,
                                     pitchBend: 0,
                                     timbre: 0,
                                     pressure: 112 })
})

test ('Process timbre message', (t) => {
  let z = mpeZone (0, 2)
  let z2 = processNoteOnMessage (z) (on (64, 95, 1))
  let z3 = processTimbreMessage (z2) (cc (74, 112, 1))
  t.true (z3.activeNotes.length === 1)
  t.deepEqual (z3.activeNotes [0], { note: 64,
                                     channel: 1,
                                     velocity: 95,
                                     pitchBend: 0,
                                     timbre: 112,
                                     pressure: 95 })

  let z4 = processTimbreMessage (z3) (cc (74, 100, 2))
  t.true (z3.activeNotes.length === 1)
  t.deepEqual (z3.activeNotes [0], { note: 64,
                                     channel: 1,
                                     velocity: 95,
                                     pitchBend: 0,
                                     timbre: 112,
                                     pressure: 95 })
})

test ('Process pitch bend message', (t) => {
  let z = mpeZone (0, 2)
  let z2 = processNoteOnMessage (z) (on (64, 95, 1))
  let z3 = processPitchBendMessage (z2) (pb (3520, 1))
  t.true (z3.activeNotes.length === 1)
  t.deepEqual (z3.activeNotes [0], { note: 64,
                                     channel: 1,
                                     velocity: 95,
                                     pitchBend: 3520,
                                     timbre: 0,
                                     pressure: 95 })

  let z4 = processPitchBendMessage (z3) (pb (16383, 2))
  t.true (z3.activeNotes.length === 1)
  t.deepEqual (z3.activeNotes [0], { note: 64,
                                     channel: 1,
                                     velocity: 95,
                                     pitchBend: 3520,
                                     timbre: 0,
                                     pressure: 95 })
})

// ----------------------------- to MPE ----------------------------------

test ('Get notes per channel', (t) => {
  let z = mpeZone (0, 2)
  t.deepEqual (notesPerChannel (z), [[1, 0], [2, 0]])
  let z2 = processNoteOnMessage (z) (on (64, 96, 1))
  t.deepEqual (notesPerChannel (z2), [[1, 1], [2, 0]])
  let z3 = processNoteOnMessage (z2) (on (56, 96, 2))
  t.deepEqual (notesPerChannel (z3), [[1, 1], [2, 1]])
  let z4 = processNoteOnMessage (z3) (on (32, 96, 1))
  t.deepEqual (notesPerChannel (z4), [[1, 2], [2, 1]])
})

test ('Least notes channel algorithm', (t) => {
  let z = mpeZone (0, 2)
  t.deepEqual (1, leastNotesChannel (z) ())
  let z2 = processNoteOnMessage (z) (on (64, 96, 1))
  t.deepEqual (2, leastNotesChannel (z2) ())
  let z3 = processNoteOnMessage (z2) (on (64, 75, 2))
  t.deepEqual (1, leastNotesChannel (z3) ())
  let z4 = processNoteOffMessage (z3) (off (64, 12, 2))
  t.deepEqual (2, leastNotesChannel (z4) ())
})

test ('Channel by key range algorithm', (t) => {
  let z = mpeZone (0, 3)
  let keyRanges = [
    { channel: 1, min: 28, max: 47, weight: 3 },
    { channel: 1, min: 48, max: 65, weight: 0 },
    { channel: 2, min: 40, max: 70, weight: 2 },
    { channel: 3, min: 52, max: 82, weight: 1 }
  ]

  // Add notes function
  let v = addNotes (notesPerChannel (z)) (keyRanges [0])
  t.deepEqual (v, { channel: 1, min: 28, max: 47, weight: 3, notes: 0 })

  v = sort (byNotesAndWeight) 
           (map (addNotes (notesPerChannel (z))) (keyRanges))
  t.deepEqual (
    v,
    [
      { channel: 1, min: 28, max: 47, weight: 3, notes: 0 },
      { channel: 2, min: 40, max: 70, weight: 2, notes: 0 },
      { channel: 3, min: 52, max: 82, weight: 1, notes: 0 },
      { channel: 1, min: 48, max: 65, weight: 0, notes: 0 },
    ])

  // Test preference of empty channels to weight on sorting
  let z2 = processNoteOnMessage (z) (on (42, 96, 1))
  v = sort (byNotesAndWeight) 
           (map (addNotes (notesPerChannel (z2))) (keyRanges))
  t.deepEqual (
    v,
    [
      { channel: 2, min: 40, max: 70, weight: 2, notes: 0 },
      { channel: 3, min: 52, max: 82, weight: 1, notes: 0 },
      { channel: 1, min: 28, max: 47, weight: 3, notes: 1 },
      { channel: 1, min: 48, max: 65, weight: 0, notes: 1 },
    ])

  t.deepEqual (1, channelByKeyRange (keyRanges) (z) (on (32)))
  t.deepEqual (1, channelByKeyRange (keyRanges) (z) (on (45)))
  t.deepEqual (2, channelByKeyRange (keyRanges) (z) (on (64)))
  t.deepEqual (3, channelByKeyRange (keyRanges) (z) (on (75)))

  t.deepEqual (2, channelByKeyRange (keyRanges) (z2) (on (43)))

  let z3 = processNoteOnMessage (z2) (on (43, 96, 2))
  v = sort (byNotesAndWeight)
           (map (addNotes (notesPerChannel (z3))) (keyRanges))
  t.deepEqual (
    v,
    [
      { channel: 3, min: 52, max: 82, weight: 1, notes: 0 },
      { channel: 1, min: 28, max: 47, weight: 3, notes: 1 },
      { channel: 2, min: 40, max: 70, weight: 2, notes: 1 },
      { channel: 1, min: 48, max: 65, weight: 0, notes: 1 },
    ])

  t.deepEqual (1, channelByKeyRange (keyRanges) (z3) (on (32)))
  t.deepEqual (1, channelByKeyRange (keyRanges) (z3) (on (45)))
  t.deepEqual (3, channelByKeyRange (keyRanges) (z3) (on (64)))
  t.deepEqual (3, channelByKeyRange (keyRanges) (z3) (on (75)))
})
