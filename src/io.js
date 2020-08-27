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

let midiAccess

// ------------------- WebMidi initialization ----------------------

export let initialize = 
	(sysex = false, 
	 custom_navigator = window.navigator) =>
		custom_navigator
			.requestMIDIAccess({ sysex: sysex })
			.then(m => { 
				midiAccess = m; 
				return midiAccess; 
			})

export let logPorts = () => {
	forEach(
		i => console.log(i[1].name + '  -in->'), 
		[...midiAccess.inputs.entries()])
	forEach(
		o => console.log('-out->  ' + o[1].name), 
		[...midiAccess.outputs.entries()])
}

// ------------------------- MIDI Input ----------------------------

export let input = n => 
	head(
		pipe(
			filter(i => i[1].name.includes(n)),
			map(v => {
				let input = rx.fromEvent(
								v[1], 'midimessage'
              )
				input.name = v[1].name
				input.id = v[1].id
				input.manufacturer = v[1].manufacturer
				input.version = v[1].version

				return input
			})
		)([...midiAccess.inputs.entries()]))

// ------------------------- MIDI Output ---------------------------

export let send = out => msg => 
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

export let output = n => 
	head(
		pipe(
			map( ([k, v]) => v ),
			filter( ({ name }) => name.includes(n) ),
			map( v => { v.open(); return v; } ),
			map( v => {
				let output = send(v)
				Object.defineProperty(
					output, 
					'name', 
					{ value: v.name })
				output.id = v.id
				output.manufacturer = v.manufacturer
				output.version = v.version

				return output
			}) 
		)([...midiAccess.outputs.entries()]))

// ---------------------- MIDI File loading ------------------------

export let loadMidiFile =
	(sel = '#preview') => {
		let id = 'local-midi-file-browser'
		var e = document.querySelector(sel)
		e.innerHTML = e.innerHTML + '<input type="file" id="' + id + '" style="display: none">'
		let promise = 
			new Promise((s, r) => 
				MidiParser.parse(document.querySelector('#' + id), o => { 
					document.querySelector('#' + id).remove()
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

					return s(o)
				}))
		document.querySelector('#' + id).click()
		return promise
	}

// ------------------------ MIDI Clock -----------------------------

// TODO: Make this part better

export let createTimer = (resolution, look_ahead) =>
  rx.timer (0, resolution).pipe (
    rxo.map(v => [performance.now (), look_ahead])
  )

export let MIDIClock = curry ((time_division, bpm) => {
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

export let MIDIPlayer = (midifile) => {
  let player = MIDIFilePlayer (midifile)

  return rx.pipe (
    rxo.scan (([events, tick], midi_clocks) => {
      return player (tick, midi_clocks)
    }, [null, 0]),
    rxo.map(([events, tick]) => events)
  )
}
