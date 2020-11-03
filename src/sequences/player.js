import {
  createSequence, mergeTracks, sortEvents, withAbsoluteDeltaTimes
} from './sequences.js'
import { processMessage } from './state.js'
import {
  isContinue, isMIDIClock, isStart, isStop
} from '../predicates/predicates.js'
import { isTempoChange } from '../predicates/meta.js'
import { isSequenceEvent } from '../predicates/frmeta.js'
import { timeStamp, sequence as sequenceLens } from '../lenses/lenses.js'
import {
  concat, cond, dropWhile, either, isNil, isEmpty,
  last, map, pipe, prepend, prop, reduce,
  set, splitWhen, T, tail, view
} from 'ramda'
import { from as rx_from, NEVER as rx_NEVER, pipe as rx_pipe } from 'rxjs'
import { 
  mergeMap as rxo_mergeMap, scan as rxo_scan 
} from 'rxjs/operators'

// ------------------------ Playing MIDI Sequences -----------------------

export const prepareSequence = (sequence) =>
  pipe (
    withAbsoluteDeltaTimes,
    mergeTracks,
    sortEvents
  ) (sequence)

// NOTE: Analyze another implementation option:
// [ first_event if absTime === currentAbsTime, ...recurse more events ]
export const sequencePlayer = (sequence) => {
  const preparedSequence = prepareSequence (sequence)
  const maxTick = prop ('absoluteDeltaTime')
                       (last (preparedSequence.tracks [0]))

  let rec = (currentAbsoluteDeltaTime, playable) => {
    playable = playable || preparedSequence

    return (msg) => {
      let filtered = 
        dropWhile 
          ((e) => e.absoluteDeltaTime < currentAbsoluteDeltaTime)
          (playable.tracks [0])

      let events = 
        splitWhen 
          ((e) => e.absoluteDeltaTime > currentAbsoluteDeltaTime)
          (filtered)

      if (sequence.loop && currentAbsoluteDeltaTime === maxTick) {
        let [_, seq, events2] = rec (0, preparedSequence) (msg)

        return [
          1,
          seq,
          prepend 
            (msg)
            (concat (map (set (timeStamp) (view (timeStamp) (msg))) 
                         (events [0])) 
                    (tail (events2)))
        ]
      } else {
        return [
          currentAbsoluteDeltaTime + 1,
          createSequence (events [1]) (playable.timeDivision),
          prepend (msg)
                  (map (set (timeStamp) (view (timeStamp) (msg))) 
                       (events [0]))
        ]
      }
    }
  }

  return rec
}

export const player = (sequence, paused = false) =>
  rx_pipe (
    rxo_scan (
      ([seqPlayer, tick, playable, _events, playing, state], msg) =>
        cond ([

          [isMIDIClock, (msg) => {
            if (playing) {
              const [nextTick, nextPlayable, events] =
                seqPlayer (tick, playable) (msg)

              return [
                seqPlayer,
                nextTick,
                nextPlayable,
                events,
                true,
                reduce ((a, v) => processMessage (a) (v)) (state) (events)
              ]
            } else {
              return [seqPlayer, tick, playable, [msg], false, state]
            }
          }],

          [isStart, (msg) =>
            [seqPlayer, 0, null, [msg], true, []]],

          [isContinue, (msg) =>
            [seqPlayer, tick, playable, [msg], true, []]],

          [isStop, (msg) => 
            [seqPlayer, 
             tick, 
             playable, 
             [msg, ...state],
             false, 
             []]],

          [isSequenceEvent, (msg) =>
            [sequencePlayer (view (sequenceLens) (msg)), 
             tick, 
             null, 
             [msg, ...state], 
             playing,
             []]],

          [T, (msg) =>
            [seqPlayer, 
             tick, 
             playable, 
             [msg], 
             playing, 
             state]]

        ]) (msg)
      , [sequencePlayer (sequence), 0, null, null, !paused, []]),
    rxo_mergeMap (([_p, _dt, _s, events]) => 
      either (isNil) (isEmpty) (events) ?
        rx_NEVER
        : rx_from (events)))

export const play = (midifile) => {
  let tempo_listener = new rx_Subject ()

  return rx_merge (
    timer (),
    tempo_listener
  ).pipe (
    clock (30, midifile.timeDivision),
    player (midifile),
    rxo_tap ((msg) => {
      if (isTempoChange (msg)) {
        tempo_listener.next (msg)
      }
    })
  )
}

