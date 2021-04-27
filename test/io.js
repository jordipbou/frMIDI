const test = require ('ava')
const EventEmitter = require ('events')
const { now } = require ('performance-now')

import { 
    initialize, 
    input, inputFrom, inputsAsText, 
    output, outputsAsText, send 
  } from '../src/io/io.js'
import { on, off } from '../src/messages'
import { bind, concat } from 'ramda'
import { of, Subject } from 'rxjs'

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

  t.deepEqual (
    inputsAsText (),
    ['Input 1  -in->', 'Input 2  -in->'])

  t.deepEqual (
    outputsAsText (),
    ['-out->  Output 1'])
})

test ('Log input/output ports to console with midiAccess as parameter', async (t) => {
  const midiAccess = await initialize (false, custom_navigator)

  t.deepEqual (
    inputsAsText (midiAccess),
    ['Input 1  -in->', 'Input 2  -in->'])

  t.deepEqual (
    outputsAsText (midiAccess),
    ['-out->  Output 1'])
})

test ('Input creation', (t) => {
  let midi_input = []
  let subscriber = (v) => midi_input = concat (midi_input) ([v])

  let dummy = inputFrom ()
  t.deepEqual (dummy.name, 'Dummy input')
  t.deepEqual (dummy.id, 'DIn')
  t.deepEqual (dummy.manufacturer, 'frMIDI')
  t.deepEqual (dummy.version, 'dummy0.0')

  let dummyX = dummy.subscribe (subscriber)

  dummy.next (on (64))
  t.deepEqual (midi_input, [on (64)])

  dummyX.unsubscribe ()
  midi_input = []

  let in1 = inputFrom (Input1)
  t.deepEqual (in1.name, 'Input 1')
  t.deepEqual (in1.id, 'Input1')
  t.deepEqual (in1.manufacturer, 'frmidi')
  t.deepEqual (in1.version, 'mmiixx9')

  let in1X = in1.subscribe (subscriber)

  in1.next (on (67))
  t.deepEqual (midi_input, [on (67)])

  Input1.emit ('midimessage', on (68))
  t.deepEqual (midi_input, [on (67), on (68)])

  in1X.unsubscribe ()
})

test ('Create input by name', async (t) => {
  await initialize (false, custom_navigator)

  // Take default (first one)
  let in0 = input ()
  t.deepEqual (in0.name, 'Input 1')

  // First that includes 2 in its name
  let in2 = input ('2')
  t.deepEqual (in2.name, 'Input 2')

  // First that includes Input in its name
  let in1 = input ('Input')
  t.deepEqual (in1.name, 'Input 1')
  t.deepEqual (in1.id, 'Input1')
  t.deepEqual (in1.manufacturer, 'frmidi')
  t.deepEqual (in1.version, 'mmiixx9')

  // Return dummy input
  let d = input ('dummy')
  t.deepEqual (d.name, 'Dummy input')
  t.deepEqual (d.id, 'DIn')
  t.deepEqual (d.manufacturer, 'frMIDI')
  t.deepEqual (d.version, 'dummy0.0')
})

test ('Create input by name with midiAccess as parameter', async (t) => {
  const midiAccess = await initialize (false, custom_navigator)

  // Take default (first one)
  let in0 = input ('', midiAccess)
  t.deepEqual (in0.name, 'Input 1')

  // First that includes 2 in its name
  let in2 = input ('2', midiAccess)
  t.deepEqual (in2.name, 'Input 2')

  // First that includes Input in its name
  let in1 = input ('Input', midiAccess)
  t.deepEqual (in1.name, 'Input 1')
  t.deepEqual (in1.id, 'Input1')
  t.deepEqual (in1.manufacturer, 'frmidi')
  t.deepEqual (in1.version, 'mmiixx9')

  // Return dummy input
  let d = input ('dummy', midiAccess)
  t.deepEqual (d.name, 'Dummy input')
  t.deepEqual (d.id, 'DIn')
  t.deepEqual (d.manufacturer, 'frMIDI')
  t.deepEqual (d.version, 'dummy0.0')
})

test ('Send function', (t) => {
  let midi_output = []
  let output = {
    send: (d) => midi_output = concat (midi_output) ([d])
  }

  // Sending midi object
  midi_output = []
  send (output.send) (on (65))
  t.deepEqual (midi_output, [[144, 65, 96]])

  // Sending (subscribing to) an observable
  let s = new Subject ()
  let sx = send (output.send) (s)
  midi_output = []
  s.next (on (68))
  t.deepEqual (midi_output, [[144, 68, 96]])
  s.next (off (68))
  t.deepEqual (midi_output, [[144, 68, 96], [128, 68, 96]])
})

test ('Cold observables should work on send too', (t) => {
  let midi_output = []
  let output = {
    send: (d) => midi_output = concat (midi_output) ([d])
  }

  send (output.send) (of (on (64), off (64)))
  t.deepEqual (midi_output, [[144, 64, 96], [128, 64, 96]])
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

  //// Subscribing to a MIDI output (for testing)
  let alt_midi_output = []
  let receive = (msg) => alt_midi_output = concat (alt_midi_output) ([msg])
  let ox = out.subscribe (receive)
  out (off (64))
  t.deepEqual (midi_output, [[144, 64, 96], [128, 64, 96]])
  t.deepEqual (alt_midi_output, [off (64)])
})

test ('Calling output send function with next syntax', async (t) => {
  await initialize (false, custom_navigator)

  midi_output = []
  let out = output ()
  out.next (on (64))
  t.deepEqual (midi_output, [[144, 64, 96]])
})

test ('Output instantiation with midiAccess as parameter', async (t) => {
  const midiAccess = await initialize (false, custom_navigator)
  midi_output = []

  let out = output ('', midiAccess)
  t.deepEqual (out.name, 'Output 1')
  t.deepEqual (out.id, 'Output1')
  t.deepEqual (out.manufacturer, 'frmidi')
  t.deepEqual (out.version, 'mmiixx11')

  out (on (64))
  t.deepEqual (midi_output, [[144, 64, 96]])

  //// Subscribing to a MIDI output (for testing)
  let alt_midi_output = []
  let receive = (msg) => alt_midi_output = concat (alt_midi_output) ([msg])
  let ox = out.subscribe (receive)
  out (off (64))
  t.deepEqual (midi_output, [[144, 64, 96], [128, 64, 96]])
  t.deepEqual (alt_midi_output, [off (64)])
})

