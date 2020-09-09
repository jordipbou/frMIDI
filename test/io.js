const test = require ('ava')
const EventEmitter = require ('events')

import { initialize, input, logPorts, output, send } from '../src/io.js'
import { on, off } from '../src/messages.js'

import { concat } from 'ramda'
import { Subject } from 'rxjs'

const MIDIInputs = new Map ()
const Input1 = new EventEmitter ()
Input1.name = 'Input 1'
Input1.id = 'Input1'
Input1.manufacturer = 'frmidi'
Input1.version = 'mmiixx9'
MIDIInputs.set ('Input1', Input1)
MIDIInputs.set ('Input2', { name: 'Input 2',
                            id: 'Input2',
                            manufacturer: 'frmidi',
                            version: 'mmiixx10' })

let midi_output = []
const MIDIOutputs = new Map ()
MIDIOutputs.set ('Output1', 
                 { name: 'Output 1',
                   id: 'Output1',
                   manufacturer: 'frmidi',
                   version: 'mmiixx11',
                   open: () => undefined,
                   send: (d) => midi_output = concat (midi_output) ([d]) })

const custom_navigator = {
  requestMIDIAccess: ({ sysex }) => Promise.resolve ({
    sysexEnabled: sysex,
    inputs: MIDIInputs,
    outputs: MIDIOutputs,
    onstatechanged: null
  })
}

test ('WebMIDI API initialization', async (t) => {
  // Testing that initialize returns a correct promise
  // with midiAccess object as value.
  let midiAccess = await initialize (false, custom_navigator)
  t.is (midiAccess.sysexEnabled, false)
})

test ('Log input/output ports to console', async (t) => {
  await initialize (false, custom_navigator)
  let log_output = []
  let log = (s) => log_output = concat (log_output) ([s])
  logPorts (log)
  t.deepEqual (
    log_output, 
    ['Input 1  -in->', 'Input 2  -in->', '-out->  Output 1'])
})

test ('Input instatiation', async (t) => {
  await initialize (false, custom_navigator)

  // Take default (first one)
  let in0 = input ()
  t.deepEqual (in0.name, 'Input 1')

  let in2 = input ('2')
  t.deepEqual (in2.name, 'Input 2')

  let in1 = input ('Input')
  t.deepEqual (in1.name, 'Input 1')
  t.deepEqual (in1.id, 'Input1')
  t.deepEqual (in1.manufacturer, 'frmidi')
  t.deepEqual (in1.version, 'mmiixx9')

  let midi_input = []
  let subscriber = (v) => midi_input = concat (midi_input) ([v])

  let in1x = in1.subscribe (subscriber)

  Input1.emit ('midimessage', on (64))
  t.deepEqual (midi_input, [on (64)])

  Input1.emit ('midimessage', off (64))
  t.deepEqual (midi_input, [on (64), off (64)])

  in1.emit (on (68))
  t.deepEqual (midi_input, [on (64), off (64), on (68)])
  
  in1x.unsubscribe ()

  // Send thru input for testing purposes
  
})

test ('Send function', (t) => {
  let midi_output = []
  let output = {
    send: (d) => midi_output = concat (midi_output) ([d])
  }

  // Sending an array
  midi_output = []
  send (output) (on (64).data)
  t.deepEqual (midi_output, [[144, 64, 96]])

  // Sending midi object
  midi_output = []
  send (output) (on (65))
  t.deepEqual (midi_output, [[144, 65, 96]])

  // Sending array of midi messages as arrays
  midi_output = []
  send (output) ([on (66).data, off (66).data])
  t.deepEqual (midi_output, [[144, 66, 96], [128, 66, 96]])

  // Sending array of midi messages as objects
  midi_output = []
  send (output) ([on (67), off (67)])
  t.deepEqual (midi_output, [[144, 67, 96], [128, 67, 96]])

  // Sending (subscribing to) an observable
  let s = new Subject ()
  let sx = send (output) (s)
  midi_output = []
  s.next (on (68))
  t.deepEqual (midi_output, [[144, 68, 96]])
  s.next (off (68))
  t.deepEqual (midi_output, [[144, 68, 96], [128, 68, 96]])
})

test ('Output instantiation', async (t) => {
  await initialize (false, custom_navigator)

  let out = output ()
  t.deepEqual (out.name, 'Output 1')
  t.deepEqual (out.id, 'Output1')
  t.deepEqual (out.manufacturer, 'frmidi')
  t.deepEqual (out.version, 'mmiixx11')

  out (on (64))
  t.deepEqual (midi_output, [[144, 64, 96]])

  // Subscribing to a MIDI output (for testing)
  let alt_midi_output = []
  let receive = (msg) => alt_midi_output = concat (alt_midi_output) ([msg])
  let ox = out.subscribe (receive)
  out (off (64))
  t.deepEqual (midi_output, [[144, 64, 96], [128, 64, 96]])
  t.deepEqual (alt_midi_output, [[128, 64, 96]])
})
