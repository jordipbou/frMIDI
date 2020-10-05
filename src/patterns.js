import { on, off } from './messages'
import { 
  filter, flatten, length, map, multiply, pipe, reduce, type 
} from 'ramda'

// Patterns are totally based on Tidal Cycles.

// The idea here is expand the patterns to have always a 
// harmonic pattern and a rhythmic pattern. Both of them
// are independent and can be combined to form a unique
// pattern.

// ----------------------- Harmonic Pattern ------------------------------

// ----------------------- Rhythmic pattern ------------------------------

export let getPatternTimeDivision =	(p) => {
	if (type (p) !== 'Array') {
		return 1
	} else if (length (filter (v => type (v) === 'Array', p)) === 0) {
		return length (p)
	} else {
		return pipe (
			map (v => getPatternTimeDivision (v)),
			reduce (multiply, 1),
			multiply (length (p))
		) (p)
	}
}
	
export let getPatternEvents =	(p, td) => {
	if (type (p) !== 'Array') {
		return [on (p, 96), off (p, 96, 0, 0, td)]
	} else {
		return flatten (map (v => getPatternEvents (v, td / length(p)), p))
	}
}
	
export let pattern = (p) => {
	let timeDivision = getPatternTimeDivision (p)

	return [getPatternEvents (p, timeDivision), timeDivision]
}
