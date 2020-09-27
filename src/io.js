import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import { 
  bind, cond, curry, filter, forEach, head, is, last, 
  map, pipe, prop, propEq
} from 'ramda'

import { msg, from } from './messages.js'
import {
  //seemsArrayOfMIDIMessagesAsArrays,
  //seemsArrayOfMIDIMessagesAsObjects,
  //seemsMIDIMessageAsArray,
  //seemsMIDIMessageAsObject
  seemsArrayOfMIDIMessages,
  seemsMIDIMessage
} from './predicates.js'

import { 
  MidiParser 
  } from '../node_modules/midi-parser-js/src/midi-parser.js'

export { 
  MidiParser 
  } from '../node_modules/midi-parser-js/src/midi-parser.js'

let midiAccess

// ------------------- WebMidi initialization ----------------------

// Initializes WebMIDI API and saves midiAccess object for later
// use of frMIDI library.
// MidiAccess object is also returned in the case it's needed by
// the user.
// 
// A custom_navigator parameter is used to allow testing without
// a defined window object.

export const initialize = 
  (sysex = false, custom_navigator = window.navigator) =>
		custom_navigator
			.requestMIDIAccess ({ sysex: sysex })
			.then (m => midiAccess = m)

// Writes every input and output port name to the console for reference
// when instatiating input and output objects.
//
// Parameter logfn is used to pass a different logger for testing
// purposes.

export const inputsAsText = () =>
	map (
		i => i [1].name + '  -in->', 
		[...midiAccess.inputs.entries ()])

export const outputsAsText = () =>
	map (
		o => '-out->  ' + o [1].name, 
		[...midiAccess.outputs.entries ()])

export const logPorts = () => {
  forEach (console.log) (inputsAsText ())
  forEach (console.log) (outputsAsText ())
}

// ------------------------- MIDI Input ----------------------------

// Return an observable created from WebMIDI input onmidimessage event.
// Name is matched against available input ports and first one that
// contains it is used.

export const inputFrom = (i) => {
  let emitter = new rx.Subject ()
  if (i) {
    let input = rx.merge (
      rx.fromEvent (i, 'midimessage'),
      emitter )
    input.name = i.name
    input.id = i.id
    input.manufacturer = i.manufacturer
    input.version = i.version
    input.next = bind (emitter.next, emitter)

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
    : head (
  	    pipe (
  	    	filter ( ([id, i]) => i.name.includes (n) ),
  	    	map ( ([id, i]) => inputFrom (i) )
  	    ) ([...midiAccess.inputs.entries()]))

// ------------------------- MIDI Output ---------------------------

// Send function accepts midi messages as:
// - byte array
// - MIDIMessage object
// - array of byte arrays
// - array of MIDIMessage objects
// - observable emitting any of the above

export const send = (sendfn) => (msg) => 
//  seemsArrayOfMIDIMessagesAsObjects (msg) ?
//    forEach (m => sendfn (m.data, m.timeStamp)) (msg)
//    : seemsArrayOfMIDIMessagesAsArrays (msg) ?
//      forEach (m => sendfn (m)) (msg)
//      : seemsMIDIMessageAsObject (msg) ?
//        sendfn (msg.data, msg.timeStamp)
//        : seemsMIDIMessageAsArray (msg) ?
//          sendfn (msg)
//          : is (rx.Observable) (msg) ?
//            msg.subscribe (send (sendfn))
//            : null
  seemsArrayOfMIDIMessages (msg) ?
    forEach (m => sendfn (m.data, m.timeStamp)) (msg)
    : seemsMIDIMessage (msg) ?
      sendfn (msg.data, msg.timeStamp)
      : is (rx.Observable) (msg) ?
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
    output.subscribe = bind (receiver.subscribe, receiver)

    return output
  } else {
    let sendfn = (d, t) => receiver.next (msg (d, t))
    let output = send (sendfn)
    Object.defineProperty (output, 'name', { value: 'Dummy output' })
    output.id = 'DOut'
    output.manufacturer = 'frMIDI'
    output.version = 'dummy0.0'
    output.subscribe = bind (receiver.subscribe, receiver)

    return output
  }
}

export const output = (n = '') =>
  n === 'dummy' ?
    outputFrom ()
    : head (
		    pipe (
		    	map ( ([k, v]) => v ),
		    	filter ( ({ name }) => name.includes (n) ),
		    	map ( v => { v.open(); return v; } ),
		    	map ( v => outputFrom (v) )
		    ) ([ ...midiAccess.outputs.entries () ]))

// ---------------------- MIDI File loading ------------------------

// Opens a file selection dialog to load a MIDI file and then parse
// it using midi-parser-js library. Converts messages to be
// compatible with rest of library.
//
// Returns a promise that returns parsed MIDI file as object.

export const loadMidiFile =	() => {
  let input_file_element = document.createElement ('input')
  let type = document.createAttribute ('type')
  type.value = 'file'
  input_file_element.setAttributeNode (type)

	let promise = 
		new Promise((s, r) => 
			MidiParser.parse(input_file_element, o => { 
				// Convert data from each event to a format compatible
				// with rest of library
				for (let t of o.track) {
					for (let e of t.event) {
						e.timeStamp = 0
						if (e.type > 7 && e.type < 14) {
							if (e.data instanceof Array) {
								e.data = [(e.type << 4) + e.channel, ...e.data]
							} else {
								e.data = [(e.type << 4) + e.channel, e.data]
							}
							e.type = 'midimessage'
						} else if (e.type === 255) {
							e.type = 'metaevent'
              e.data = [ e.data ]
						}
					}
				}

				return s (o)
			}))

	input_file_element.click()

	return promise
}

// ------------------------ MIDI Clock -----------------------------

// TODO: Make this part better

export const createTimer = (resolution = 25, look_ahead = 150) =>
  rx.timer (0, resolution).pipe (
    rxo.map(v => [performance.now (), look_ahead])
  )

export const MIDIClock = curry ((time_division, bpm) => {
  let timeDivisionSubject = new rx.BehaviorSubject (time_division)
  let bpmSubject = new rx.BehaviorSubject (bpm)
  
  let op = rx.pipe(
    rxo.withLatestFrom (
      timeDivisionSubject,
      bpmSubject
    ),
    rxo.scan ((events, [[now, look_ahead], time_division, bpm]) => {
      let last_tick_time = prop ('timeStamp', last (events)) || now
  
      return lookAheadClock (
        time_division, 
        bpm, 
        last_tick_time,
        now,
        look_ahead)
    }, [[], null])
  )

  op.timeDivision = (v) => timeDivisionSubject.next (v)
  op.bpm = (v) => bpmSubject.next (v)

  return op
})

export const MIDIPlayer = (midifile) => {
  let player = MIDIFilePlayer (midifile)

  return rx.pipe (
    rxo.scan (([events, tick], midi_clocks) => {
      return player (tick, midi_clocks)
    }, [null, 0]),
    rxo.map(([events, tick]) => events)
  )
}
