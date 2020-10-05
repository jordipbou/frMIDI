export * from './predicates'
export * from './messages'
export * from './lenses'
export * from './clock'
export * from './sequences'
export * from './mpe'
export * from './patterns.js'
export * from './music_defs.js'
export * from './io.js'

export const version = '1.0.43'

//// --------------------- Other utilities -------------------------

export const midiToHzs = (n, tuning = 440) => 
	((tuning / 32) * (Math.pow(((n - 9) / 12), 2)))
