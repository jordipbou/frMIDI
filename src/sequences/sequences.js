import { isTempoChange } from '../predicates'
import { from } from '../messages'
import { timeStamp } from '../lenses'
import { createTimer, MIDIClock } from '../clock'
import { pipe as rx_pipe } from 'rxjs'
import { 
    map as rxo_map, tap as rxo_tap, scan as rxo_scan 
  } from 'rxjs/operators'
import {
    __, addIndex, always, allPass, append, assoc, both, concat, 
    either, evolve, filter, forEach, has, head, is, isEmpty, last,
    map, mergeLeft, objOf, pipe, prop, propIs, propEq, reduce, 
    reduceWhile, scan, set, slice, sort, tail
  } from 'ramda'

// ------------------------- Predicates ----------------------------

export const seemsSequence =
  allPass ([is (Object),
            has ('formatType'),
            has ('timeDivision'),
            has ('tracks'),
            has ('track'),
            propIs (Array, 'track')])

export const seemsLoop =
  both (seemsSequence)
       (propEq ('loop', true))

// -------------------------- Helpers ------------------------------

export const withAbsoluteDeltaTimes =
  evolve ({
    track: map (
      evolve ({
        event: pipe (
          scan
            (([tick, _], msg) => [tick + msg.deltaTime, msg])
            ([0, null]),
          map
            (([tick, msg]) =>
              msg !== null ?
                from (mergeLeft ({ absoluteDeltaTime: tick }, msg))
                : null),
              tail)}))})

export const mergeTracks =
  evolve ({
    tracks: always (1),
    track: pipe (
      reduce ((acc, v) => concat(acc, v.event), []),
      map (v => from (v)),
      objOf ('event'),
      append (__, []))})

export const sortEvents =
    evolve ({
  track: pipe (
    map (v =>
      pipe (
        sort ((a, b) => a.absoluteDeltaTime - b.absoluteDeltaTime),
        map (v => from (v))
      )(v.event)),
    head,
    objOf ('event'),
    append (__, []))})

export const filterTracks =	(tracks, midiFile) => 
  evolve ({
    tracks: () => tracks.length,
    track: pipe (
        addIndex (filter) ((v, k) => tracks.includes (k)),
        map (v => objOf ('event', map (from, v.event)))
      )
    }, midiFile)

// TODO
//export let addTrack/s = (midiFile, tracks) => 

// TODO
//export let changeTimeDivision = (midiFile, newTimeDivision) =>

// TODO
// export let commonTimeDivision = (midiFile1, midiFile2, ...) => 

// ------------------ MIDI File creation from tracks ---------------------

export const createSequence = (track, timeDivision = 24) => ({
  formatType: 1,
  tracks: 1,
  timeDivision: timeDivision,
  track: [{ event: map (from, track) }]
})

export const createLoop =	(midifile) => ({
  ...midifile,
  loop: true,
  track: map (
    pipe (
      prop ('event'),
      map (from),
      objOf ('event')
    )
  ) (midifile.track)
})

// ---------------------------- Playing MIDI -----------------------------

export const sequencePlayer = (midifile) => {
  let playable = pipe (
    withAbsoluteDeltaTimes,
    mergeTracks,
    sortEvents
  ) (midifile)

  let track = playable.track [0].event
  let loop = playable.loop
  let maxTick = last (track).absoluteDeltaTime

  return (tick, midi_clocks) => 
    slice 
      (0, 2)
      (reduceWhile 
        (([events, tick, bpm_not_found], midi_clock) => bpm_not_found)
        (([events, tick, bpm_not_found], midi_clock) => {
          let tick_events = pipe (
            filter (e => 
              e.absoluteDeltaTime === tick ||
              (loop &&  e.absoluteDeltaTime === (tick % maxTick))),
            map (set (timeStamp) (midi_clock.timeStamp)),
          ) (track)

          return [
            concat (events, tick_events), 
            loop ? (tick + 1) % maxTick : tick + 1,
            isEmpty (filter (isTempoChange) (tick_events))
          ]
        })
        ([[], tick, true])
        (midi_clocks))
}

export const player = (midifile) => {
  let player = sequencePlayer (midifile)

  return rx_pipe (
    rxo_scan (
      ([events, tick], midi_clocks) => player (tick, midi_clocks), 
      [null, 0]),
    rxo_map (([events, tick]) => events)
  )
}

export const play = (midifile) => {
    let t = createTimer ()
    let clock = MIDIClock (midifile.timeDivision, 30)

    return t.pipe (
      clock,
      player (midifile),
      rxo_tap ((events) => 
        forEach ((m) => clock.bpm (QNPM2BPM (m.data [0])))
                (filter (isTempoChange) (events)))
    )
  }
  
export const QNPM2BPM = (qnpm) => 60 * 1000000 / qnpm

