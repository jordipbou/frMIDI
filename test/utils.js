const test = require ('ava')
import { multiSet } from '../src/utils.js'
import { on } from '../src/messages'
import { timeStamp, deltaTime } from '../src/lenses'
import { set } from 'ramda'

test ('multiSet', (t) => {
  t.deepEqual (
    multiSet ([ timeStamp, deltaTime ]) ([3, 5]) (on (64)),
    set (deltaTime) (5) (on (64, 96, 0, 3)))
})
