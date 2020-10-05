import { timeStamp } from '../lenses'
import { mc } from '../messages'
import { 
    complement, curry, isEmpty, last, length, prop, set, view
  } from 'ramda'
import { 
    BehaviorSubject, pipe, Subject, timer, asapScheduler
  } from 'rxjs'
import { 
    filter, map, scan, switchMap, takeUntil, repeat, withLatestFrom 
  } from 'rxjs/operators'
import { pausable } from 'rxjs-pausable'
import { isBrowser, isNode } from 'browser-or-node/src/index.js'

// asapScheduler's now function is modified to use browser's
// performance.now or node-now function.
// Using schedulers from timer timings allows easier testing
// when using testScheduler and correct MIDI timings (which are
// based on performance.now on browser and not on Date.now).

if (isBrowser) {
  asapScheduler.now = window.performance.now.bind (window.performance)
}

if (isNode) {
  asapScheduler.now = () => {
    let hr = process.hrtime ()
    return (hr [0] * 1e9 + hr [1]) / 1e9
  }
}

// TODO: Export scheduler for other modules

// ------------------------------ Timer ----------------------------------

// The idea of a timer "independent" of the events with a look ahead
// window was taken from this great article by Chris Wilson:
// https://www.html5rocks.com/en/tutorials/audio/scheduling/

export const createTimer = 
  (resolution = 25, look_ahead = 150, scheduler = asapScheduler) => 
    timer (0, resolution, scheduler)
      .pipe (map(v => [scheduler.now (), look_ahead]))

// -------------------- MIDI Clock message generation -------------------

// Creates an array of MIDI Clock events with correct future timestamps
// having into account current time (now) and look ahead 
// window (look_ahead) for indicated bpm and time_division (pulses
// per quarter note).

// Messages will be generated even before current time if last tick time
// is in the past.

export const lookAheadClock = 
  curry ((time_division, bpm, last_tick_time, now, look_ahead) => {
    let ms_per_tick = 60000 / (bpm * time_division)
    let look_ahead_end = now + look_ahead

    let events = []

    let next_tick_time
    if (last_tick_time === null) {
      // If last_tick_time is null, MIDI clocks start at 0.
      last_tick_time = now
      next_tick_time = now
    } else {
      // If last_tick_time is not null, MIDI clocks start
      // on next ms_per_tick
      next_tick_time = last_tick_time + ms_per_tick
    }

    while (next_tick_time < look_ahead_end) {
      if ((last_tick_time === null && next_tick_time >= now + ms_per_tick)
       || (last_tick_time !== null && next_tick_time >= last_tick_time)) {
        events.push (set (timeStamp) (next_tick_time) (mc ()))
      }

      next_tick_time = next_tick_time + ms_per_tick
    }

    if (length (events) > 0) {
      return [events, view (timeStamp) (last (events))]
    } else {
      return [[], last_tick_time]
    }
  })

// ----------------------- MIDI Clock operator ---------------------------

// Transforms a timer stream to a stream arrays of MIDI Clock messages.

// Received stream on scan:
// [[pe, ltt], [[now, la], td, bpm]
// pe -> past MIDI clock emitted events
// ltt -> last tick time to continue calculation
// now -> current time, received from timer
// la -> look ahead window, received from time
// td -> as used to calculate MIDI clock events
// bpm -> desired beats per minute
export const MIDIClock = curry (
  (time_division = 1, bpm = 120, custom_now = asapScheduler.now) => {
    let timeDivisionSubject = new BehaviorSubject (time_division)
    let bpmSubject = new BehaviorSubject (bpm)
    
    let op = pipe(
      withLatestFrom (
        timeDivisionSubject,
        bpmSubject
      ),
      scan (
        ([pe, ltt], [[now, la], td, bpm]) => 
          lookAheadClock (td, bpm, ltt, now, la)
        , [[], null]), 
      map (([events, last_tick_time]) => events),
      filter (complement (isEmpty))
    )
  
    op.timeDivision = (v) => timeDivisionSubject.next (v)
    op.bpm = (v) => bpmSubject.next (v)
  
    return op
  })

// -------------------------- MIDI Transport -----------------------------

// TODO: Think how to implement a MIDI Transport.
// It should allow play/pause/stop, song position and tempo adjustment.
