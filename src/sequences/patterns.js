import { 
  addDeltaTime, setTrackTimeDivision, withoutTime
} from './sequences.js'
import { on, off } from '../messages/messages.js'
import { endOfTrack } from '../messages/meta.js'
import { patternItemEvent } from '../messages/frmeta.js'
import { isNoteOn } from '../predicates/predicates.js'
import { isEndOfTrack } from '../predicates/meta.js'
import { 
  time, channel, deltaTime, note 
} from '../lenses/lenses.js'
import { lcm, setFrom } from '../utils.js'
import { 
  addIndex, adjust, always, append, apply, both, 
  complement, concat, cond, curry,
  filter, flatten, identity, init, is, isEmpty, last, length, 
  map, multiply, none, objOf, pipe, reduce, set,
  T, type, view
} from 'ramda'

// Patterns are totally based on Tidal Cycles.

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
    [T, always (set (time) (ptd + td * idx) (patternItemEvent (p)))]
  ]) (p)

export const pattern = (p) => {
  let timeDivision = getPatternTimeDivision (p)

  return [
    withoutTime 
      (addDeltaTime 
        (append 
          (set (time) (timeDivision) (endOfTrack ()))
          (getPatternEvents (timeDivision, p)))), 
    timeDivision || 1
  ]
}

export const concatPatterns = curry (([p1, td1], [p2, td2]) => {
  let m1 = setTrackTimeDivision (lcm (td1, td2)) (td1) (p1)

  return [
    concat 
      (init (m1))
      (adjust 
        (0) 
        (setFrom (deltaTime) (last (m1)))
        (setTrackTimeDivision (lcm (td1, td2)) (td2) (p2))),
    lcm (td1, td2)
  ]})
