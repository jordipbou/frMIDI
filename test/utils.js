const test = require ('ava')
import { multiSet, setFrom } from '../src/utils.js'
import { on } from '../src/messages'
import { deltaTime, note, timeStamp } from '../src/lenses'
import { set, view } from 'ramda'

test ('multiSet', (t) => {
  t.deepEqual (
    multiSet ([ timeStamp, deltaTime ]) ([3, 5]) (on (64)),
    set (deltaTime) (5) (on (64, 96, 0, 3)))
})

test ('setFrom', (t) => {
  t.deepEqual (
    set (note) (view (note) (on (64))) (on (32)),
    setFrom (note) (on (64)) (on (32)))
})
