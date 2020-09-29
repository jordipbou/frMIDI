export * from './predicates.js'
export * from './messages.js'
export * from './lenses.js'
export * from './helpers.js'
export * from './clock.js'
export * from './midifile.js'
export * from './mpe.js'
export * from './io.js'

export const version = '1.0.41'

//// --------------------- Other utilities -------------------------

export const midiToHzs = (n, tuning = 440) => 
	((tuning / 32) * (Math.pow(((n - 9) / 12), 2)))
