import * as R from 'ramda'
import * as X from 'rxjs'
import * as O from 'rxjs/operators'
import * as F from './init_frMIDI.js'

export const sequence = {
  formatType: 1,
  timeDivision: 1,
  tracks: [
    [
        R.set (F.deltaTime) (0) (F.on (64)),
        R.set (F.deltaTime) (1) (F.off (64)),
        R.set (F.deltaTime) (0) (F.on (67)),
        R.set (F.deltaTime) (2) (F.off (67)),
        R.set (F.deltaTime) (1) (F.on (71)),
        R.set (F.deltaTime) (3) (F.off (71))
    ],
    [
        R.set (F.deltaTime) (0) (F.on (32)),
        R.set (F.deltaTime) (8) (F.off (32)),
    ]
  ]
}
