const test = require ('ava')
import { meterSequence } from '../../src/sequences/metronome.js'
import { endOfTrack } from '../../src/messages/meta.js'
import { 
    barEvent, beatEvent, restEvent, subdivisionEvent 
  } from '../../src/messages/frmeta.js'
import { deltaTime } from '../../src/lenses/lenses.js'
import { set } from 'ramda'

test ('meterSequence', (t) => {
  t.deepEqual (
    meterSequence ([1, 0, 2, 1, 2, 0], 280),
    {
      formatType: 1,
      timeDivision: 280,
      loop: true,
      tracks: [
        [
          set (deltaTime) (0) (barEvent ()),
          set (deltaTime) (40) (restEvent (0)),
          set (deltaTime) (40) (subdivisionEvent (0)),
          set (deltaTime) (40) (beatEvent (0)),
          set (deltaTime) (40) (subdivisionEvent (0, 40)),
          set (deltaTime) (40) (restEvent (0, 40)),
          set (deltaTime) (40) (endOfTrack (0))
        ]
      ]
    })
})
