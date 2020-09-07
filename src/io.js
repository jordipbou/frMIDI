import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import { 
  cond, curry, filter, forEach, head, is, last, 
  map, pipe, prop, propEq
} from 'ramda'

import { from } from './messages.js'
import {
  seemsArrayOfMIDIMessagesAsArrays,
  seemsArrayOfMIDIMessagesAsObjects,
  seemsMIDIMessageAsArray,
  seemsMIDIMessageAsObject
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

export const logPorts = (logfn = console.log) => {
	forEach (
		i => logfn (i [1].name + '  -in->'), 
		[...midiAccess.inputs.entries ()])
	forEach (
		o => logfn ('-out->  ' + o [1].name), 
		[...midiAccess.outputs.entries ()])
}

// ------------------------- MIDI Input ----------------------------

// Return an observable created from WebMIDI input onmidimessage event.
// Name is matched against available input ports and first one that
// contains it is used.

export const input = (n = '') => 
	head (
		pipe (
			filter ( ([id, i]) => i.name.includes (n)),
			map ( ([id, i]) => {
				let input = rx.fromEvent (i, 'midimessage')
				input.name = i.name
				input.id = i.id
				input.manufacturer = i.manufacturer
				input.version = i.version

				return input
			})
		) ([...midiAccess.inputs.entries()]))

// ------------------------- MIDI Output ---------------------------

// Send function accepts midi messages as:
// - byte array
// - MIDIMessage object
// - array of byte arrays
// - array of MIDIMessage objects
// - observable emitting any of the above

export const send = (out) => (msg) => 
  seemsArrayOfMIDIMessagesAsObjects (msg) ?
    forEach (m => out.send (m.data, m.timeStamp)) (msg)
    : seemsArrayOfMIDIMessagesAsArrays (msg) ?
      forEach (m => out.send (m)) (msg)
      : seemsMIDIMessageAsObject (msg) ?
        out.send (msg.data)
        : seemsMIDIMessageAsArray (msg) ?
          out.send (msg)
          : is (rx.Observable) (msg) ?
            msg.subscribe (send (out))
            : null

// Sends first output that matches indicated name as argument and
// returns send function instantiated with selected output.
// Some properties are added for inspection purposes.

export const output = (n = '') => 
	head (
		pipe (
			map ( ([k, v]) => v ),
			filter ( ({ name }) => name.includes (n) ),
			map ( v => { v.open(); return v; } ),
			map ( v => {
				let output = send (v)
				Object.defineProperty (
					output, 
					'name', 
					{ value: v.name })
				output.id = v.id
				output.manufacturer = v.manufacturer
				output.version = v.version

				return output
			}) 
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
