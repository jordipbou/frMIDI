const test = require ('ava')
const { map, prop } = require ('ramda')
const { lookAheadTicks, lookAheadClock } = require ('../../src/frMIDI/clock.js')

test ('lookAheadClock', t => {
  t.deepEqual 
    (map (prop ('timeStamp')) 
         (lookAheadClock (1000, 60, null, 0, 10)),
     [1, 2, 3, 4, 5, 6, 7, 8, 9])
})
