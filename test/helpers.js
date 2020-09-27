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
