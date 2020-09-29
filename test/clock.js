const test = require ('ava')
import { map, prop } from 'ramda'
import { 
  lookAheadTicks, lookAheadClock 
  } from '../src/clock.js'

test ('lookAheadClock', t => {
  // 1 tick on 60 bpm = 1 tick every second (1000ms)
  t.deepEqual (
    map (prop ('timeStamp')) (lookAheadClock (1, 60, null, 0, 10)),
    [0])

  t.deepEqual (
    map (prop ('timeStamp')) (lookAheadClock (1, 60, 0, 0, 10)),
    [])

  t.deepEqual (
    map (prop ('timeStamp')) (lookAheadClock (1, 60, null, 0, 2000)),
    [0, 1000])

  t.deepEqual (
    map (prop ('timeStamp')) (lookAheadClock (1, 60, 0, 0, 2000)),
    [1000])

  t.deepEqual (
    map (prop ('timeStamp')) (lookAheadClock (1, 60, 0, 0, 2001)),
    [1000, 2000])

  t.deepEqual (
    map (prop ('timeStamp')) (lookAheadClock (1, 60, 0, 500, 1000)),
    [1000])

  // With a time division of 1000 and bpm of 60
  // we get a MIDI Clock message every millisecond.
  t.deepEqual 
    (map (prop ('timeStamp')) 
         (lookAheadClock (1000, 60, null, 0, 10)),
     [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

  t.deepEqual 
    (map (prop ('timeStamp')) 
         (lookAheadClock (1000, 60, 0, 0, 10)),
     [1, 2, 3, 4, 5, 6, 7, 8, 9])

  t.deepEqual 
    (map (prop ('timeStamp')) 
         (lookAheadClock (1000, 60, 150, 145, 10)),
     [151, 152, 153, 154])

  t.deepEqual 
    (map (prop ('timeStamp')) 
         (lookAheadClock (1000, 60, 155, 145, 10)),
     [])
})
