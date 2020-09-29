import { timeStamp } from './lenses.js'
import { mc } from './messages.js'
import { curry, set } from 'ramda'

// ----------------- MIDI Clock message generation -----------------

// Creates an array of MIDI Clock events with correct future timestamps
// having into account current time (now) and look ahead 
// window (look_ahead) for indicated bpm and time_division (pulses
// per quarter note).
// A time division of 1 and bpm of 60 will generate 1 tick per second.
// A time division of 2 and bpm of 60 will generate 2 ticks per second.
// A time division of 4 and bpm of 120 will generate 2 ticks per second.

// last_tick_time is starting point and no message is generated for
// it as it will repeat the last message from previous call.
export let lookAheadClock = 
  curry ((time_division, bpm, last_tick_time, now, look_ahead) => {
    let ms_per_tick = 60000 / (bpm * time_division)
    let look_ahead_end = now + look_ahead

    let events = []

    if (last_tick_time === null) {
      last_tick_time = now
    } else {
      last_tick_time = last_tick_time + ms_per_tick
    }

    while (last_tick_time < look_ahead_end) {
      if (last_tick_time >= now) {
        events.push (set (timeStamp) (last_tick_time) (mc ()))
      }
      last_tick_time = last_tick_time + ms_per_tick
    }

    return events
  })

