import { on, off } from '../messages/messages.js'
import { isNoteOn } from '../predicates/predicates.js'
import { isEndOfTrack } from '../predicates/meta.js'
import { channel, deltaTime, note } from '../lenses/lenses.js'
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
    [none (is (Array)), pipe (filter (complement (isEndOfTrack)), length)],
    [T, (p) => {
      let seq = filter (complement (isEndOfTrack)) (p)

      return  multiply (length (seq))
                       (reduce (lcm)
                               (1)
                               (map (getPatternTimeDivision) (seq)))
    }]
  ]) (p)

export const getPatternEvents = (td, p, first = true) =>
  cond ([
    [is (Array), 
      pipe (
        addIndex 
          (map) 
          ((a, i) => 
            getPatternEvents (td / length (p), 
                              a, 
                              i === 0)), 
        flatten)],
    [isNoteOn, 
      (msg) => 
        [
          msg, 
          off (
            view (note) (msg), 
            96, 
            view (channel) (msg), 
            0, 
            td)
        ]],
    [T, set (deltaTime) (first ? 0 : td)]
  ]) (p)

export const pattern = (p) => {
  let timeDivision = getPatternTimeDivision (p)

  return [getPatternEvents (timeDivision, p), timeDivision]
}
