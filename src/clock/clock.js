import { isMIDIClock } from '../predicates/predicates.js'
import { isTempoChange } from '../predicates/meta.js'
import { 
    isTimingEvent, isTimeDivisionEvent 
  } from '../predicates/frmeta.js'
import { 
    lookAhead, tempo, timeDivision as lTimeDivision, timing, timeStamp
  } from '../lenses/lenses.js'
import { mc, off, on, timingEvent } from '../messages'
import { QNPM2BPM, frScheduler } from '../utils.js'
import { 
    cond, complement, isEmpty, last, length, prop, set, T, view
  } from 'ramda'
import { 
    BehaviorSubject as rx_BehaviorSubject, 
    from as rx_from,
    NEVER as rx_NEVER,
    of as rx_of,
    pipe as rx_pipe, 
    timer as rx_timer, 
  } from 'rxjs'
import { 
    filter as rxo_filter, 
    map as rxo_map, 
    mergeMap as rxo_mergeMap,
    scan as rxo_scan, 
    switchMap as rxo_switchMap,
    withLatestFrom as rxo_withLatestFrom
  } from 'rxjs/operators'
import { pausable } from 'rxjs-pausable'

// ------------------------------ Timer ----------------------------------

// The idea of a timer "independent" of the events with a look ahead
// window was taken from this great article by Chris Wilson:
// https://www.html5rocks.com/en/tutorials/audio/scheduling/

// Here, a subject or an operator is implemented, depending on
// how it's initialized.
// The operators just forwards incoming MIDI messages and adds
// timing meta events as needed.

export const timer = 
  (resolution = 25, look_ahead = 150, scheduler = frScheduler) => 
    rx_timer (0, resolution, scheduler)
      .pipe (rxo_map(v => timingEvent (scheduler.now (), look_ahead)))

// -------------------- MIDI Clock message generation -------------------

// Creates an array of MIDI Clock events with correct future timestamps
// having into account current time (now) and look ahead 
// window (look_ahead) for indicated bpm and time_division (pulses
// per quarter note).
             
export const futureClock =
  (time_division, bpm, last_tick_time, timing_event_msg) => {
    let now = view (timing) (timing_event_msg)
    let look_ahead = view (lookAhead) (timing_event_msg)
    let ms_per_tick = 60000 / (bpm * time_division)
    let look_ahead_end = now + look_ahead

    let events = []

    let next_tick_time
    let look_ahead_start
    if (last_tick_time === null) {
      // If last_tick_time is null, MIDI clocks start at 0.
      last_tick_time = now
      next_tick_time = now
      look_ahead_start = now 
    } else {
      // If last_tick_time is not null, MIDI clocks start
      // on next ms_per_tick
      next_tick_time = last_tick_time + ms_per_tick
      look_ahead_start = last_tick_time + ms_per_tick
    }

    while (next_tick_time < look_ahead_end) {
      if (next_tick_time >= look_ahead_start
        && next_tick_time >= now) {
        events.push (mc (next_tick_time))
      }

      next_tick_time = next_tick_time + ms_per_tick
    }

    if (length (events) > 0) {
      return [events, view (timeStamp) (last (events)), bpm]
    } else {
      return [[], last_tick_time, bpm]
    }
  }

// ----------------------- MIDI Clock operator ---------------------------

// Rx operator that transforms timing meta events into MIDI Clock
// messages. 
// Also recognizes tempo change meta events to modify MIDI 
// Clock messages rate (forwarded).
// Responds to timeDivisionChange (frMIDI meta event) to allow
// changing time division on the fly for changing sequences, for
// example.
// Rest of MIDI messages are just forwarded.

export const clock = (bpm = 120, timeDivision = 24) =>
  rx_pipe (
    rxo_scan (
      ([_past_events, ltt /* last tick time */, bpm, td, _last_msg], msg) =>
        cond ([

          [isTimingEvent, 
            (msg) => [...futureClock (td, bpm, ltt, msg), td, null]],

          // Only clock should respond to tempoChange messages inside
          // frMIDI, and it makes no sense to put one clock after another,
          // so tempoChange messages are not forwarded to avoid a feedback
          // with player operator.
          [isTempoChange, 
            (msg) => [[], ltt, QNPM2BPM (view (tempo) (msg)), td, null]],

          [isTimeDivisionEvent,
            (msg) => [[], ltt, bpm, view (lTimeDivision) (msg), msg]],

          [T, (msg) => [[], ltt, bpm, td, msg]]

        ]) (msg)
      , [[], null, bpm, timeDivision, null]),
    rxo_switchMap (([events, _ltt, _bpm, _td, msg]) =>
      msg === null ?
        isEmpty (events) ?
          rx_NEVER
          : rx_from (events)
        : rx_of (msg))
  )

// ------------------------ Metronome operator ---------------------------

//const metronomeNote = (note) => (msg) => [
//  msg,
//  set (timeStamp) (view (timeStamp) (msg)) (off (38, 96, 9)),
//  set (timeStamp) (view (timeStamp) (msg)) (off (48, 96, 9)),
//  set (timeStamp) (view (timeStamp) (msg)) (off (51, 96, 9)),
//  set (timeStamp) (view (timeStamp) (msg)) (on (note, 96, 9))
//]
//
//const processMIDIClock = (bpb, spb, td, cb, ctd, cs) => (msg) => [
//  bpb,
//  spb,
//  td,
//  cb === 0 ? (bpb * td) - 1 : cb - 1,
//  ctd === 0 ? td - 1 : ctd - 1,
//  cs === 0 ? (td / spb) - 1 : cs - 1,
//  cb === 0 && ctd === 0 && cs === 0 ?
//    metronomeNote (48) (msg)
//    : ctd === 0 && cs === 0 ?
//      metronomeNote (51) (msg)
//      : cs === 0 ?
//        metronomeNote (38) (msg)
//        : [msg]
//]
//
//// TODO: Idea, make complex metronome by changing observables (switchMap?)
//// when completing one cycle 
//export const metronome = (beatsPerBar, subbeatsPerBeat, timeDivision) =>
//  rx_pipe (
//
//    rxo_scan (([bpb, spb, td, cb, ctd, cs, _events], msg) =>
//      cond ([
//
//        [isMIDIClock, processMIDIClock (bpb, spb, td, cb, ctd, cs)],
//
//        [T, (msg) => [bpb, spb, td, cb, ctd, cs, [msg]]]
//
//      ]) (msg)
//    , [beatsPerBar, 
//       subbeatsPerBeat, 
//       timeDivision, 
//       0, // Current beat
//       0, // Current timeDivision
//       0, // Current subdivision
//       null]),
//
//    rxo_mergeMap (([_bpb, _spb, _td, _b, _ctd, _s, events]) =>
//      isEmpty (events) ?
//        rx_NEVER
//        : rx_from (events)))
//
//const defaultSounds = {
//  bar: 48,
//  beat: 51,
//  subdivision: 38,
//  channel: 9
//}
//
//// TODO: A metronome is not a fucking pattern ??
//// For example, 4 / 4 metronome with eighth notes:
//// [M, S, B, S, B, S, B]
//// Buleria:
//// [M, S, S, B, S, S, B, S, B, S, B, S]
//
//// The thing is that instead of notes, frMIDI events can be sent
//// for each type of event: start of measure, beat and subdivision,
//// that will be represented as bar_event, beat_event and
//// subdivision_event that can later be mapped to notes as desired.
//
//// -------------------------- MIDI Transport -----------------------------
//
//// TODO: What's a transport ? It's something that is able to generate
//// start/pause/continue commands (and maybe respond to them also)
//// and also the song position pointer command.
//export const transport = () => {
//  let op = rx_pipe (
//    pausable (),
//  ) ()
//
//  return op
//}
