const test = require ('ava')
import { 
  addNote, getNextChannel, getNote, isActiveNote,
  lensP, mpeNote, mpeZone, processNote, removeNote
  } from '../src/helpers.js'
import { on, off } from '../src/messages.js'
import { velocity } from '../src/lenses.js'
import { gt, lt } from 'ramda'

test ('Lens predicates', (t) => {
  t.true (lensP (velocity, gt, 64) (on (54, 96)))
  t.true (lensP (velocity, lt, 100) (on (54, 96)))
  t.false (lensP (velocity, lt, 64) (on (54, 96)))
})

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
                    zoneSize: 4,
                    channels: [0, 1, 2, 3],
                    activeNotes: [] })

  z = mpeZone (3, 8)
  t.deepEqual (z, { masterChannel: 3,
                    zoneSize: 8,
                    channels: [3, 4, 5, 6, 7, 8, 9, 10],
                    activeNotes: [] })
})

test ('Get next MPE channel', (t) => {
  let z = mpeZone (0, 4)
  let m = on (64)
  t.deepEqual (getNextChannel (z), 0)

  z.activeNotes = [mpeNote (on (64, 96, 0))]
  t.deepEqual (getNextChannel (z), 1)

  z.activeNotes = [mpeNote (on (64, 96, 0)), mpeNote (on (65, 96, 2))]
  t.deepEqual (getNextChannel (z), 1)

  z.activeNotes = [mpeNote (on (64, 96, 0)),
                   mpeNote (on (65, 96, 1)),
                   mpeNote (on (66, 96, 2)),
                   mpeNote (on (67, 96, 3))]
  t.deepEqual (getNextChannel (z), 0)

  z.activeNotes = [mpeNote (on (64, 96, 3)),
                   mpeNote (on (65, 96, 1)),
                   mpeNote (on (66, 96, 2)),
                   mpeNote (on (67, 96, 0))]
  t.deepEqual (getNextChannel (z), 3)
})

test ('Add active note to MPE zone', (t) => {
  let z = mpeZone (2, 4)
  let [z2, m2] = addNote (z) (on (64))
  t.deepEqual (m2, on (64, 96, 2))

  let [z3, m3] = addNote (z2) (on (65))
  t.deepEqual (m3, on (65, 96, 3))

  let [z4, m4] = addNote (z3) (on (66))
  t.deepEqual (m4, on (66, 96, 4))

  let [z5, m5] = addNote (z4) (on (67))
  t.deepEqual (m5, on (67, 96, 5))

  let [z6, m6] = addNote (z5) (on (68))
  t.deepEqual (m6, on (68, 96, 2))
})

test ('Remove active note from MPE zone', (t) => {
  let z = mpeZone (2, 4)
  let [z2, m2] = addNote (z) (on (64))
  let [z3, m3] = addNote (z2) (on (65))

  let [z4, m4] = removeNote (z3) (off (64))
  t.deepEqual (m4, off (64, 96, 2))
  t.deepEqual (z4.activeNotes, [mpeNote (on (65, 96, 3))])
  t.deepEqual (getNextChannel (z4), 2)
})

test ('Is active note', (t) => {
  let z = mpeZone (2, 4)
  let [z2, m2] = addNote (z) (on (64))
  let [z3, m3] = addNote (z2) (on (65))

  t.true (isActiveNote (z3) (on (64)))
  t.true (isActiveNote (z3) (on (65)))
  t.false (isActiveNote (z3) (on (66)))
})

test ('Process note on MPE zone', (t) => {
  let z = mpeZone (2, 4)
  let [z2, m2] = processNote (z) (on (64))
  t.deepEqual (z2.activeNotes, [mpeNote (on (64, 96, 2))])
  t.deepEqual (m2, on (64, 96, 2))

  let [z3, m3] = processNote (z2) (on (65))
  t.deepEqual (z3.activeNotes, [mpeNote (on (64, 96, 2)),
                                mpeNote (on (65, 96, 3))])
  t.deepEqual (m3, on (65, 96, 3))

  let [z4, m4] = processNote (z3) (off (65))
  t.deepEqual (z4.activeNotes, [mpeNote (on (64, 96, 2))])
  t.deepEqual (getNextChannel (z4), 3)
  t.deepEqual (m4, off (65, 96, 3))

  let [z5, m5] = processNote (z4) (off (12))
  t.deepEqual (z5, z4)
})
