import {
    assoc, clone, flatten, head, is, map, prop
  } from 'ramda'

// =================== MIDI Message creation =======================

// Converts a byte array to a MIDIMessageEvent compatible object.

export const msg = (data, timeStamp = 0) => ({
  type: 'midimessage',
  timeStamp: timeStamp,
  data: [...data]
})

export const from = (msg) =>
  is (Array, msg)
    ? assoc ('data')
      (flatten (map (prop ('data'), msg)))
      (clone (head (msg)))
    : clone (msg)

// =================== MIDI Messages definition ====================

// ------------------------ Utilities ------------------------------

export const msb = (v) => v >> 7
export const lsb = (v) => v & 0x7F
export const value14bit = (msb, lsb) => (msb << 7) + lsb

// -------------- Channel Voice messages generation ----------------

export const off = (n = 64, v = 96, ch = 0, ts = 0) =>
  msg ([128 + ch, n, v], ts)

export const on = (n = 64, v = 96, ch = 0, ts = 0) =>
  msg ([144 + ch, n, v], ts)

export const pp = (n = 64, p = 96, ch = 0, ts = 0) =>
  msg ([160 + ch, n, p], ts)

export const cc = (c = 1, v = 127, ch = 0, ts = 0) =>
  msg ([176 + ch, c, v], ts)

export const cc14bit = (c = 1, v = 8192, ch = 0, ts = 0) =>
  from ([
    cc (c, msb (v), ch, ts),
    cc (c + 32, lsb (v), ch, ts)
  ])

export const pc = (p = 0, ch = 0, ts = 0) =>
  msg ([192 + ch, p], ts)

export const cp = (p = 96, ch = 0, ts = 0) =>
  msg ([208 + ch, p], ts)

export const pb = (v = 8192, ch = 0, ts = 0) =>
  msg ([224 + ch, lsb (v), msb (v)], ts)

export const rpn = (n = 0, v = 8192, ch = 0, ts = 0) =>
  from ([
  	cc (101, n >> 7, ch, ts),
  	cc (100, n % 128, ch, ts),
  	cc (6, v >> 7, ch, ts),
  	cc (38, v % 128, ch, ts),
  	cc (101, 127, ch, ts),
  	cc (100, 127, ch, ts)
  ])

export const nrpn = (n = 0, v = 8192, ch = 0, ts = 0) =>
  from ([
    cc (99, n >> 7, ch, ts),
    cc (98, n % 128, ch, ts),
    cc (6, v >> 7, ch, ts),
    cc (38, v % 128, ch, ts),
    cc (101, 127, ch, ts),
    cc (100, 127, ch, ts)
  ])

// -------------- System common messages generation ----------------

export const syx = (b, ts = 0) =>
  msg ([240, ...b, 247], ts)

export const tc = (t, v, ts = 0) =>
  msg ([241, (t << 4) + v], ts)

export const spp = (b, ts = 0) =>
  msg ([242, b % 128, b >> 7], ts)

export const ss = (s, ts = 0) =>
  msg ([243, s], ts)

export const tun = (ts = 0) =>
  msg ([246], ts)

// ------------- System real time messages generation --------------

export const mc = (ts = 0) =>
  msg ([248], ts)

export const start = (ts = 0) =>
  msg ([250], ts)

export const cont = (ts = 0) =>
  msg ([251], ts)

export const stop = (ts = 0) =>
  msg ([252], ts)

export const as = (ts = 0) =>
  msg ([254], ts)

export const rst = (ts = 0) =>
  msg ([255], ts)

export const panic = (ts = 0) => {
  const panic_msgs = []
  for (let ch = 0; ch < 16; ch++) {
    panic_msgs.push (cc (64, 0, ch, ts))
    panic_msgs.push (cc (120, 0, ch, ts))
    panic_msgs.push (cc (123, 0, ch, ts))
    for (let n = 0; n < 128; n++) {
      panic_msgs.push (off (n, 0, ch, ts))
    }
  }

  return from (panic_msgs)
}
