export * from './predicates.js'
export * from './messages.js'
export * from './lenses.js'
export * from './clock.js'
export * from './midifile.js'
export * from './io.js'

export const version = '1.0.31'

//// --------------------- Other utilities -------------------------

export let QNPM2BPM = (qnpm) => 60 * 1000000 / qnpm

export let midiToHzs = (n, tuning = 440) => 
	((tuning / 32) * (Math.pow(((n - 9) / 12), 2)))
