import { 
    assoc, clone, curry, flatten, head, is, 
    map, prop, tail
  } from 'ramda'

// =================== MIDI Message creation =======================

// Converts a byte array to a MIDIMessageEvent compatible object.

export const msg = (data, timeStamp = 0, deltaTime = 0) => 
({ 
	type: 'midimessage', 
	timeStamp: timeStamp,
	deltaTime: deltaTime,
	data: [ ...data ],
})

export const from = (msg) =>
  is (Array, msg) ?
    assoc ('data')
          (flatten (map (prop ('data'), msg)))
          (clone (head (msg)))
    : clone (msg)

// =================== MIDI Messages definition ====================

// -------------- Channel Voice messages generation ----------------

export const off = (n = 64, v = 96, ch = 0, ts = 0, dt = 0) => 
  msg ([128 + ch, n, v], ts, dt)

export const on = (n = 64, v = 96, ch = 0, ts = 0, dt = 0) => 
  msg ([144 + ch, n, v], ts, dt)

export const pp = (n = 64, p = 96, ch = 0, ts = 0, dt = 0) => 
  msg ([160 + ch, n, p], ts, dt)

export const cc = (c = 1, v = 127, ch = 0, ts = 0, dt = 0) => 
  msg ([176 + ch, c, v], ts, dt)

export const pc = (p = 0, ch = 0, ts = 0, dt = 0) => 
  msg ([192 + ch, p], ts, dt)

export const cp = (p = 96, ch = 0, ts = 0, dt = 0) => 
  msg ([208 + ch, p], ts, dt)

export const pb = (v = 8192, ch = 0, ts = 0, dt = 0) => 
  msg ([224 + ch, v & 0x7F, v >> 7], ts, dt)

export const rpn = (n = 0, v = 8192, ch = 0, ts = 0, dt = 0) => 
  from ([
  	cc (101, n >> 7, ch, ts, dt),
  	cc (100, n % 128, ch, ts, dt), 
  	cc (6, v >> 7, ch, ts, dt),
  	cc (38, v % 128, ch, ts, dt),
  	cc (101, 127, ch, ts, dt),
  	cc (100, 127, ch, ts, dt)
  ])

export const nrpn = (n = 0, v = 8192, ch = 0, ts = 0, dt = 0) => 
from ([
	cc (99, n >> 7, ch, ts, dt),
	cc (98, n % 128, ch, ts, dt),
	cc (6, v >> 7, ch, ts, dt),
	cc (38, v % 128, ch, ts, dt),
	cc (101, 127, ch, ts, dt),
	cc (100, 127, ch, ts, dt)
])

// -------------- System common messages generation ----------------

export const syx = (b, ts = 0, dt = 0) => 
  msg ([240, ...b, 247], ts, dt)

export const tc = (t, v, ts = 0, dt = 0) => 
  msg ([241, (t << 4) + v], ts, dt)

export const spp = (b, ts = 0, dt = 0) => 
  msg ([242, b % 128, b >> 7], ts, dt)

export const ss = (s, ts = 0, dt = 0) => 
  msg ([243, s], ts, dt)

export const tun = (ts = 0, dt = 0) => 
  msg ([246], ts, dt)

// ------------- System real time messages generation --------------

export const mc = (ts = 0, dt = 0) => 
  msg ([248], ts, dt)

export const start = (ts = 0, dt = 0) => 
  msg ([250], ts, dt)

export const cont = (ts = 0, dt = 0) => 
  msg ([251], ts, dt)

export const stop = (ts = 0, dt = 0) => 
  msg ([252], ts, dt)

export const as = (ts = 0, dt = 0) => 
  msg ([254], ts, dt)

export const rst = (ts = 0, dt = 0) => 
  msg ([255], ts, dt)

export const panic = (ts = 0, dt = 0) => 
{
	const panic_msgs = []
	for (let ch = 0; ch < 16; ch++) {
		panic_msgs.push (cc (64, 0, ch, ts, dt))
		panic_msgs.push (cc (120, 0, ch, ts, dt))
		panic_msgs.push (cc (123, 0, ch, ts, dt))
		for (let n = 0; n < 128; n++) {
			panic_msgs.push (off (n, 0, ch, ts, dt))
		}
	}

	return from (panic_msgs)
}
