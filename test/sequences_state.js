const test = require ('ava')
import { mc, on, off } from '../src/messages/messages.js'
import { processMessage } from '../src/sequences/state.js'

test ('processMessage should add note on if it does not exist on state', (t) => {
  t.deepEqual (
    processMessage ([]) (on (64, 96, 0)),
    [off (64, 127, 0)])
})

test ('processMessage should not add note on if it exists on state', (t) => {
  t.deepEqual (
    processMessage 
      (processMessage ([]) (on (64, 96, 0)))
      (on (64, 96, 0)),
    [off (64, 127, 0)])
})

test ('processMessage should remove on note off', (t) => {
  t.deepEqual (
    processMessage 
      (processMessage ([]) (on (64, 96, 0)))
      (off (64, 96, 0)),
    [])
})

test ('processMessage should ignore non note messages', (t) => {
  t.deepEqual (
    processMessage ([]) (mc ()),
    [])
})
