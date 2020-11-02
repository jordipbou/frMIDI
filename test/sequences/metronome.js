const test = require ('ava')
import { meterSequence } from '../../src/sequences/metronome.js'
import { endOfTrack } from '../../src/messages/meta.js'
import { 
    barEvent, beatEvent, restEvent, subdivisionEvent 
  } from '../../src/messages/frmeta.js'

test ('meterSequence', (t) => {
  t.deepEqual (
    meterSequence ([1, 0, 2, 1, 2, 0], 280),
    {
      formatType: 1,
      timeDivision: 280,
      loop: true,
      tracks: [
        [
          barEvent (),
          restEvent (0, 40),
          subdivisionEvent (0, 40),
          beatEvent (0, 40),
          subdivisionEvent (0, 40),
          restEvent (0, 40),
          endOfTrack (0, 40)
        ]
      ]
    })
})
