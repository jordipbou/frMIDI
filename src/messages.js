import { 
    assoc, clone, curry, flatten, head, is, 
    map, prop, tail
  } from 'ramda'
import { 
    isChannelMessage 
  } from './predicates.js'

// =================== MIDI Message creation =======================

// Converts a byte array to a MIDIMessageEvent compatible object.

export let msg = (data, timeStamp = 0, deltaTime = 0) => 
({ 
	type: 'midimessage', 
	timeStamp: timeStamp,
	deltaTime: deltaTime,
	data: [ ...data ],
})

export let from = (msg) =>
  is (Array, msg) ?
    assoc ('data')
          (flatten (map (prop ('data'), msg)))
          (clone (head (msg)))
    : clone (msg)

// =================== MIDI Messages definition ====================

// -------------- Channel Voice messages generation ----------------

export let off = (n, v = 96, ch = 0) => 
  msg([128 + ch, n, v])

export let on = (n, v = 96, ch = 0) => 
  msg([144 + ch, n, v])

export let pp = (n, p = 96, ch = 0) => 
  msg([160 + ch, n, p])

export let cc = (c, v, ch = 0) => 
  msg([176 + ch, c, v])

export let pc = (p, ch = 0) => 
  msg([192 + ch, p])

export let cp = (p, ch = 0) => 
  msg([208 + ch, p])

export let pb = (v, ch = 0) => 
  msg([224 + ch, v & 0x7F, v >> 7])

export let rpn = (n, v, ch = 0) => 
  from ([
  	cc (101, n >> 7, ch),
  	cc (100, n % 128, ch), 
  	cc (6, v >> 7, ch),
  	cc (38, v % 128, ch),
  	cc (101, 127, ch),
  	cc (100, 127, ch)
  ])

export let nrpn = (n, v, ch = 0) => 
from([
	cc(99, n >> 7, ch),
	cc(98, n % 128, ch),
	cc(6, v >> 7, ch),
	cc(38, v % 128, ch),
	cc(101, 127, ch),
	cc(100, 127, ch)
])

// -------------- System common messages generation ----------------

export let syx = (b) => 
  msg([240, ...b, 247])

export let tc = (t, v) => 
  msg([241, (t << 4) + v])

export let spp = (b) => 
  msg([242, b % 128, b >> 7])

export let ss = (s) => 
  msg([243, s])

export let tun = () => 
  msg([246])

// ------------- System real time messages generation --------------

export let mc = () => 
  msg([248])

export let start = () => 
  msg([250])

export let cont = () => 
  msg([251])

export let stop = () => 
  msg([252])

export let as = () => 
  msg([254])

export let rst = () => 
  msg([255])

export let panic = () => 
{
	let panic_msgs = []
	for (let ch = 0; ch < 16; ch++) {
		panic_msgs.push (cc (64, 0, ch))
		panic_msgs.push (cc (120, 0, ch))
		panic_msgs.push (cc (123, 0, ch))
		for (let n = 0; n < 128; n++) {
			panic_msgs.push (off (n, 0, ch))
		}
	}

	return from(panic_msgs)
}
