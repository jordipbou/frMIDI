import { 
  trackDeltaTimesFromAbsolutes, trackWithoutAbsoluteDeltaTimes
} from './sequences.js'
import { on, off } from '../messages/messages.js'
import { isNoteOn } from '../predicates/predicates.js'
import { isEndOfTrack } from '../predicates/meta.js'
import { 
  absoluteDeltaTime, channel, deltaTime, note 
} from '../lenses/lenses.js'
import { lcm } from '../utils.js'
import { 
  addIndex, always, append, apply, both, complement, cond,
  filter, flatten, identity, is, isEmpty, length, 
  map, multiply, none, objOf, pipe, reduce, set,
  T, type, view
} from 'ramda'

// Patterns are totally based on Tidal Cycles.

// The idea here is expand the patterns to have always a 
// harmonic pattern and a rhythmic pattern. Both of them
// are independent and can be combined to form a unique
// pattern.

// ----------------------- Harmonic Pattern ------------------------------

// ----------------------- Rhythmic pattern ------------------------------

export const getPatternTimeDivision = (p) =>
  cond ([
    [complement (is (Array)), always (1)],
    [none (is (Array)), length],
    [T, (p) => multiply (length (p)) (reduce (lcm) (1) (map (getPatternTimeDivision) (p)))]
  ]) (p)

export const getPatternEvents = (td, p, idx = 0, ptd = 1) =>
  cond ([
    [is (Array), 
      pipe (
        addIndex 
          (map) 
          ((a, i) => getPatternEvents (td / length (p), a, i, td * idx)), 
        flatten)],
    [isNoteOn, 
      (msg) => 
        [
          set (absoluteDeltaTime) (ptd + td * idx) (msg),
          set 
            (absoluteDeltaTime)
            (ptd + td * (idx + 1))
            (off (view (note) (msg), 96, view (channel) (msg), 0))
        ]],
    [T, set (absoluteDeltaTime) (ptd + td * idx)]
  ]) (p)

export const pattern = (p) => {
  let timeDivision = getPatternTimeDivision (p)

  return [
    trackWithoutAbsoluteDeltaTimes 
      (trackDeltaTimesFromAbsolutes 
        (getPatternEvents (timeDivision, p))), 
    timeDivision
  ]
}
