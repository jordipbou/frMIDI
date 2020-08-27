const test = require ('ava')
const { add, view, set, over } = require ('ramda')
const { 
  cc, cp, mc, off, on, pp 
} = require ('../../src/frMIDI/messages.js')
const { 
  channel, control, deltaTime, note, pressure, timeStamp, velocity
} = require ('../../src/frMIDI/lenses.js')

test ('timeStamp lens', t => {
  t.is (view (timeStamp) (on (64)), 0)
  t.is (view (timeStamp) ([144, 64, 96]), undefined)

  t.is ((set (timeStamp) (100) (on (64))).timeStamp, 100)
  t.deepEqual (set (timeStamp) (100) ([144, 64, 96]), [144, 64, 96])

  t.is ((over (timeStamp) (add (3)) (on (64))).timeStamp, 3)
})

test ('deltaTime lens', t => {
  t.is (view (deltaTime) (on (64)), 0)
  t.is (view (deltaTime) ([144, 64, 96]), undefined)

  t.is ((set (deltaTime) (100) (on (64))).deltaTime, 100)
  t.deepEqual (set (deltaTime) (100) ([144, 64, 96]), [144, 64, 96])

  t.is ((over (deltaTime) (add (3)) (on (64))).deltaTime, 3)
})

test ('channel lens', t => {
  t.is (view (channel) ([128, 64, 96]), 0)
  t.is (view (channel) ([145, 64, 96]), 1)
  t.is (view (channel) ([248]), undefined)

  t.deepEqual (set (channel) (3) ([128, 64, 96]), [131, 64, 96])

  t.deepEqual 
    (over (channel) (add (1)) ([128, 64, 96]), [129, 64, 96])

  t.is (view (channel) (off (64)), 0)
  t.is (view (channel) (on (64, 96, 1)), 1)
  t.is (view (channel) (mc ()), undefined)

  t.deepEqual (set (channel) (3) (off (64)), off (64, 96, 3))

  t.deepEqual (over (channel) (add (1)) (off (64)), off (64, 96, 1))
})

test ('note lens', t => {
  t.is (view (note) (off (64)), 64)
  t.is (view (note) ([144, 64, 96]), 64)
  t.is (view (note) (pp (64)), 64)
  t.is (view (note) (cc (32, 18)), undefined)
  t.is (view (note) ([248]), undefined)

  t.deepEqual (set (note) (50) (off (64)), off (50))
  t.deepEqual (set (note) (50) ([144, 64, 96]), [144, 50, 96])
  t.deepEqual (set (note) (50) (pp (64)), pp (50))
  t.deepEqual (set (note) (50) (cc (32, 18)), cc (32, 18))
  t.deepEqual (set (note) (50) ([248]), [248])

  t.deepEqual (over (note) (add (3)) (off (64)), off (67))
  t.deepEqual (over (note) (add (3)) ([144, 64, 96]), [144, 67, 96])
  t.deepEqual (over (note) (add (-3)) (pp (64)), pp (61))
  t.deepEqual (over (note) (add (3)) (cc (32, 18)), cc (32, 18))
  t.deepEqual (over (note) (add (-3)) ([248]), [248])
})

test ('velocity lens', t => {
  t.is (view (velocity) (off (64, 96)), 96)
  t.is (view (velocity) ([144, 64, 96]), 96)
  t.is (view (velocity) (pp (64, 96)), undefined)
  t.is (view (velocity) ([248]), undefined)

  t.deepEqual (set (velocity) (127) (off (64, 96)), off (64, 127))
  t.deepEqual (set (velocity) (127) ([144, 64, 96]), [144, 64, 127]) 
  t.deepEqual (set (velocity) (127) (pp (64, 96)), pp (64, 96))

  t.deepEqual 
    (over (velocity) (add (3)) (off (64, 96)), off (64, 99))
  t.deepEqual
    (over (velocity) (add (-3)) ([144, 64, 96]), [144, 64, 93])
  t.deepEqual
    (over (velocity) (add (3)) (pp (64, 96)), pp (64, 96))
})

test ('pressure lens', t => {
  t.is (view (pressure) (pp (64, 96)), 96)
  t.is (view (pressure) ([208, 96]), 96)
  t.is (view (pressure) (on (64, 96)), undefined)

  t.deepEqual (set (pressure) (127) (pp (64, 96)), pp (64, 127))
  t.deepEqual (set (pressure) (127) ([208, 96]), [208, 127])
  t.deepEqual (set (pressure) (127) (on (64, 96)), on (64, 96))

  t.deepEqual (over (pressure) (add (3)) (pp (64, 96)), pp (64, 99))
  t.deepEqual (over (pressure) (add (-3)) ([208, 96]), [208, 93])
  t.deepEqual (over (pressure) (add (3)) (on (64, 96)), on (64, 96))
})

test ('control lens', t => {
  t.is (view (control) (cc (32, 18)), 32)
  t.is (view (control) ([176, 32, 18]), 32)
  t.is (view (control) (on (64)), undefined)

  t.deepEqual (set (control) (127) (cc (32, 18)), cc (127, 18))
  t.deepEqual (set (control) (127) ([176, 32, 18]), [176, 127,18])
  t.deepEqual (set (control) (127) (on (64)), on (64))

  t.deepEqual (over (control) (add (3)) (cc (32, 18)), cc (35, 18))
  t.deepEqual 
    (over (control) (add (-3)) ([176, 32, 18]), [176, 29, 18])
  t.deepEqual (over (control) (add (3)) (on (64)), on (64))
})
