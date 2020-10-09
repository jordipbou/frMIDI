import { isBrowser, isNode } from 'browser-or-node/src/index.js'
import { 
    asapScheduler as rx_asapScheduler,
    pipe as rx_pipe
  } from 'rxjs'
import { map as rx_map } from 'rxjs/operators'
import { curry, map, pipe, set, zip } from 'ramda'

// asapScheduler's now function is modified to use browser's
// performance.now or node-now function.
// Using schedulers from timer timings allows easier testing
// when using testScheduler and correct MIDI timings (which are
// based on performance.now on browser and not on Date.now).

let frNow

if (isBrowser) {
  frNow = window.performance.now.bind (window.performance)
}

if (isNode) {
  frNow = () => {
    let hr = process.hrtime ()
    return (hr [0] * 1e9 + hr [1]) / 1e6
  }
}

rx_asapScheduler.now = frNow

export { rx_asapScheduler as frScheduler, frNow }

export const QNPM2BPM = (qnpm) =>
  60 * 1000000 / qnpm

export const BPM2QNPM = (bpm) => 
  60 * 1000000 / bpm

export const midiToHzs = (n, tuning = 440) => 
	((tuning / 32) * (Math.pow(((n - 9) / 12), 2))) 

export const multiSet = curry((lenses, values) =>
  pipe (...map (([l, v]) => set (l) (v)) (zip (lenses) (values)))
)
