const test = require ('ava')
import { multiSet } from '../src/utils.js'
import { on } from '../src/messages'
import { timeStamp, deltaTime } from '../src/lenses'

test ('multiSet', (t) => {
  t.deepEqual (
    multiSet ([ timeStamp, deltaTime ]) ([3, 5]) (on (64)),
    on (64, 96, 0, 3, 5))
})
