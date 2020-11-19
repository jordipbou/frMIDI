import { isBrowser, isNode } from 'browser-or-node/src/index.js'
import { 
    asapScheduler as rx_asapScheduler,
    pipe as rx_pipe
  } from 'rxjs'
import { map as rx_map } from 'rxjs/operators'
import { curry, map, pipe, reduce, set, view, zip } from 'ramda'

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

export const setFrom = curry((lens, s, d) =>
  set (lens) (view (lens) (s)) (d))

// Until mathjs works well with rollup, we only need this functions

export const gcd_two_numbers = (x, y) => {
  x = Math.abs(x);
  y = Math.abs(y);
  while(y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export const lcm_two_numbers = (x, y) => {
   if ((typeof x !== 'number') || (typeof y !== 'number'))
    return false;
  return (!x || !y) ? 0 : Math.abs((x * y) / gcd_two_numbers(x, y));
}

export const lcm = (...args) =>
  reduce (lcm_two_numbers) (1) (args)
