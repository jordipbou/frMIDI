import { timeStamp } from './lenses.js'
import { mc } from './messages.js'
import { curry, set } from 'ramda'

// ----------------- MIDI Clock message generation -----------------

export let lookAheadClock = 
  curry ((time_division, bpm, last_tick_time, now, look_ahead) => {
    let ms_per_tick = 60000 / (bpm * time_division)
    let look_ahead_end = now + look_ahead

    let events = []

    last_tick_time = last_tick_time + ms_per_tick
    while (last_tick_time < look_ahead_end) {
      if (last_tick_time >= now) {
        events.push (set (timeStamp) (last_tick_time) (mc ()))
      }
      last_tick_time = last_tick_time + ms_per_tick
    }

    return events
  })

