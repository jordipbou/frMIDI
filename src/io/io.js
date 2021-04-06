import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import * as R from 'ramda'
import { seemsMessage } from '../predicates/predicates.js'
import { isTempoChange } from '../predicates/meta.js'
import { msg, from } from '../messages/messages.js'
import { addTime } from '../sequences/sequences.js'
import { 
    MidiParser 
  } from '../../node_modules/midi-parser-js/src/midi-parser.js'

import { isBrowser, isNode } from 'browser-or-node/src/index.js'

let midiAccess = undefined
let _navigator
let _now

if (isBrowser) {
  _navigator = window.navigator
  _now = window.performance.now.bind (window.performance)
}

if (isNode) {
  _now = () => {
    let hr = process.hrtime ()
    return (hr [0] * 1e9 + hr [1]) / 1e9
  }
}

// ------------------- WebMidi initialization ----------------------

// Initializes WebMIDI API and saves midiAccess object for later
// use of frMIDI library.
// MidiAccess object is also returned in the case it's needed by
// the user (as a promise)
// 
// A custom_navigator parameter is used to allow testing without
// a defined window object, or to use JZZ library on Node.

export const initialize = (sysex = false, custom_navigator = _navigator) => {
    if (!custom_navigator) {
      return Promise.reject ("On node environment, custom navigator is needed.")
    }

    if (midiAccess !== undefined) {
      return Promise.resolve (midiAccess)
    }

		return custom_navigator
			.requestMIDIAccess ({ sysex: sysex })
			.then (m => midiAccess = m)
}

// Writes every input and output port name to the console for reference
// when instatiating input and output objects.

export const inputsAsText = () =>
	R.map (
		i => i [1].name + '  -in->', 
		[...midiAccess.inputs.entries ()])

export const outputsAsText = () =>
	R.map (
		o => '-out->  ' + o [1].name, 
		[...midiAccess.outputs.entries ()])

export const logPorts = () => {
  R.forEach (console.log) (inputsAsText ())
  R.forEach (console.log) (outputsAsText ())
}

// ------------------------- MIDI Input ----------------------------

// Return an observable created from WebMIDI input onmidimessage event.
// Name is matched against available input ports and first one that
// contains it is used.

export const inputFrom = (i) => {
  let emitter = new rx.Subject ()
  if (i) {
    // TODO: This is not correctly working on node because jzz library
    // is not implementing addListener / removeListener for inputs and
    // rxjs can not create events from it.
    let input
    if (isBrowser) {
      input = rx.merge (
        rx.fromEvent (i, 'midimessage'),
        emitter )
    } else {
      i.onmidimessage = (evt) => emitter.next (evt)
      input = emitter
    }
    input.name = i.name
    input.id = i.id
    input.manufacturer = i.manufacturer
    input.version = i.version
    input.next = R.bind (emitter.next, emitter)

    return input
  } else {
    let input = emitter
    input.name = 'Dummy input'
    input.id = 'DIn'
    input.manufacturer = 'frMIDI'
    input.version = 'dummy0.0'

    return input
  }
}

export const input = (n = '') => 
  n === 'dummy' ?
    inputFrom ()
    : R.head (
  	    R.pipe (
  	    	R.filter ( ([id, i]) => i.name.includes (n) ),
  	    	R.map ( ([id, i]) => inputFrom (i) )
  	    ) ([...midiAccess.inputs.entries()]))

// ------------------------- MIDI Output ---------------------------

// Send function accepts midi messages as:
// - byte array
// - MIDIMessage object
// - array of byte arrays
// - array of MIDIMessage objects
// - observable emitting any of the above

export const send = (sendfn) => (msg) => 
  seemsMessage (msg) ?
    sendfn (msg.data, msg.timeStamp)
    : R.is (rx.Observable) (msg) ?
      msg.subscribe (send (sendfn))
      // Sometimes is (Observable) returns false, so...
      : msg.constructor.name === 'Observable' 
        && R.hasIn ('subscribe') (msg) ?
          msg.subscribe (send (sendfn))
          : null

// Sends first output that matches indicated name as argument and
// returns send function instantiated with selected output.
// Some properties are added for inspection purposes.

export const outputFrom = (o) => {
  let receiver = new rx.Subject ()
  if (o) {
    let sendfn = (d, t) => { o.send (d, t); receiver.next (msg (d, t)); }
    let output = send (sendfn)
    Object.defineProperty (output, 'name', { value: o.name })
    output.id = o.id
    output.manufacturer = o.manufacturer
    output.version = o.version
    output.subscribe = R.bind (receiver.subscribe, receiver)

    return output
  } else {
    let sendfn = (d, t) => receiver.next (msg (d, t))
    let output = send (sendfn)
    Object.defineProperty (output, 'name', { value: 'Dummy output' })
    output.id = 'DOut'
    output.manufacturer = 'frMIDI'
    output.version = 'dummy0.0'
    output.subscribe = R.bind (receiver.subscribe, receiver)

    return output
  }
}

export const output = (n = '') =>
  n === 'dummy' ?
    outputFrom ()
    : R.head (
		    R.pipe (
		    	R.map ( ([k, v]) => v ),
		    	R.filter ( ({ name }) => name.includes (n) ),
		    	R.map ( v => { v.open(); return v; } ),
		    	R.map ( v => outputFrom (v) )
		    ) ([ ...midiAccess.outputs.entries () ]))

// ---------------------- MIDI File loading ------------------------

// Opens a file selection dialog to load a MIDI file and then parse
// it using midi-parser-js library. Converts messages to be
// compatible with rest of library.
//
// Returns a promise that returns parsed MIDI file as object.

export const convertFromMidiParser = (midifile) => ({
  formatType: midifile.formatType, 
  timeDivision: midifile.timeDivision,
  tracks: 
    R.map 
      (R.map 
        ((e) => {
          e.timeStamp = 0
          if (e.type > 7 && e.type < 14) {
            if (R.is (Array) (e.data)) {
              e.data = [
                (e.type << 4) + e.channel,
                ...e.data
              ]
            } else {
              e.data = [
                (e.type << 4) + e.channel,
                e.data
              ]
            }
            e.type = 'midimessage'
          } else if (e.type === 255) {
            e.type = 'metaevent'
            e.data = [ e.data ]
          }

          return e }))
      (R.map (R.prop ('event')) (midifile.track))
})

export const loadMIDIFile =	() => {
  let input_file_element = document.createElement ('input')
  let type = document.createAttribute ('type')
  type.value = 'file'
  input_file_element.setAttributeNode (type)

	let promise = 
		new Promise((solve, reject) => 
			MidiParser.parse(
        input_file_element, 
        midifile => 
          solve (convertFromMidiParser (midifile))
      ))

	input_file_element.click()

	return promise
}

// ------------------ Cycle.js drivers ----------------------

// MIDI Driver sources are both used to indicate state changes
// on inputs/outputs and for receiving MIDI data from them.
// MIDI Driver sinks are used to configure required input/
// outputs and for sending MIDI data.

// TODO: This should work with adapt, not directly with rxjs, but
// it's not working (wrong version of rxjs -6- for adapt maybe?)
// As I will be using this exclusively with rxjs, let's maintain this
// like it is for now.

export const MIDIDriver = (graph$) => {
  let subscriptions = []

  graph$.addListener ({
    next: (g) => {
      R.forEach ((s) => s.unsubscribe ()) (subscriptions)
      subscriptions = 
        R.map 
          ((k) => {
            if (isBrowser) {
              return g [k].subscribe (output (k))
            } else {
              return g [k].pipe (
                rxo.map ((v) => msg (v.data))
              ).subscribe (output (k))
            }
          })
          (R.keys (g))
    }
  })

  return {
    input: input
  }
}

// Example, redirect Port-0 input to Port-1 output.

//const main = (sources) => {
//  const port0 = sources.MIDI.input ('Port-0')
//  const outgraph$ = new X.BehaviorSubject ({ 'Port-1': port0 })
//
//  return {
//    MIDI: outgraph$
//  }
//}
//
//M.initialize (false, J).then (() => run (main, { MIDI: M.MIDIDriver }))

