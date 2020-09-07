const test = require ('ava')
import { map, prop } from 'ramda'
import { 
  lookAheadTicks, lookAheadClock 
  } from '../src/clock.js'

test ('lookAheadClock', t => {
  t.deepEqual 
    (map (prop ('timeStamp')) 
         (lookAheadClock (1000, 60, null, 0, 10)),
     [1, 2, 3, 4, 5, 6, 7, 8, 9])
})
